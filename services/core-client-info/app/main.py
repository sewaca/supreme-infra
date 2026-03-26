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
from app.routers import (
    profile,
    rating,
    settings as settings_router,
    status,
    subjects,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


setup_instrumentation()

app = FastAPI(
    title="core-client-info",
    description="Client information service — stores user profile, settings, ratings, achievements, grades, references, orders, and subject priorities",
    version="0.1.0",
    root_path="/core-client-info",
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
app.include_router(profile.router)
app.include_router(settings_router.router)
app.include_router(rating.router)
app.include_router(subjects.router)
