import logging
import time
from contextlib import asynccontextmanager

from _auth_routes_generated import AUTH_ROUTES
from authorization_py.middleware import AuthMiddleware
from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.instrumentation import instrument_app, setup_instrumentation
from app.routers import broadcasts, conversations, files, messages, messages_search, status, users, ws
from app.services.redis_pubsub import RedisPubSub
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    pubsub: RedisPubSub | None = None
    print(f"[core-messages] REDIS_URL={settings.redis_url or '<not set>'}", flush=True)
    if settings.redis_url:
        try:
            pubsub = RedisPubSub(settings.redis_url)
            pubsub.set_ws_manager(ws_manager)
            ws_manager.set_pubsub(pubsub)
            await pubsub.start()
            print("[core-messages] Redis Pub/Sub started OK", flush=True)
        except Exception as exc:
            print(f"[core-messages] Redis Pub/Sub FAILED: {exc}", flush=True)
            logger.exception("Failed to start Redis Pub/Sub — falling back to local-only WS delivery")
            pubsub = None
    else:
        print("[core-messages] REDIS_URL not set — local-only WS delivery", flush=True)
        logger.warning("REDIS_URL not set — WS delivery is local-only (single-pod mode)")

    yield

    if pubsub:
        await pubsub.stop()
    await engine.dispose()


setup_instrumentation()

app = FastAPI(
    title="core-messages",
    description="Messaging — direct messages, broadcasts, file attachments",
    version="0.1.0",
    root_path="/core-messages",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    AuthMiddleware,
    routes=AUTH_ROUTES,
    core_auth_url=settings.core_auth_url,
    jwt_secret=settings.jwt_secret,
)

instrument_app(app)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    query = f"?{request.url.query}" if request.url.query else ""
    logger.info("%s %s%s → %d (%.0fms)", request.method, request.url.path, query, response.status_code, duration_ms)
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        body_bytes = await request.body()
        body_str = body_bytes.decode("utf-8", errors="replace")
    except Exception:
        body_str = "<unreadable>"
    query = f"?{request.url.query}" if request.url.query else ""
    logger.error(
        "422 Validation error | %s %s%s | body=%s | errors=%s",
        request.method,
        request.url.path,
        query,
        body_str[:2000],
        exc.errors(),
    )
    return await request_validation_exception_handler(request, exc)


app.include_router(status.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(messages_search.router)
app.include_router(broadcasts.router)
app.include_router(users.router)
app.include_router(files.router)
app.include_router(ws.router)
