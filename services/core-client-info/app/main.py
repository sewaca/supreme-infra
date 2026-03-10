from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.instrumentation import instrument_app, setup_instrumentation
from app.routers import dormitory, orders, profile, rating, references, settings as settings_router, status, subjects


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

instrument_app(app)

app.include_router(status.router)
app.include_router(profile.router)
app.include_router(settings_router.router)
app.include_router(rating.router)
app.include_router(references.router)
app.include_router(orders.router)
app.include_router(subjects.router)
app.include_router(dormitory.router)
