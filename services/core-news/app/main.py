import asyncio
from contextlib import asynccontextmanager, suppress

from _auth_routes_generated import AUTH_ROUTES
from authorization_py.middleware import AuthMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.instrumentation import instrument_app, setup_instrumentation
from app.routers import (
    news as news_router,
    status,
)
from app.services.scheduler import sync_news


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    initial_sync_task = asyncio.create_task(sync_news())
    try:
        yield
    finally:
        initial_sync_task.cancel()
        with suppress(asyncio.CancelledError):
            await initial_sync_task
        await engine.dispose()


setup_instrumentation()

app = FastAPI(
    title="core-news",
    description="news parsing and displaying service",
    version="0.1.0",
    root_path="/core-news",
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

app.include_router(status.router)
app.include_router(news_router.router)
