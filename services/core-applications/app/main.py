from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.instrumentation import instrument_app, setup_instrumentation
from app.routers import applications, dormitory, orders, references, status


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


setup_instrumentation()

app = FastAPI(
    title="core-applications",
    description="Applications service — user applications, references, orders, and dormitory management",
    version="0.1.0",
    root_path="/core-applications",
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
app.include_router(applications.router)
app.include_router(references.router)
app.include_router(orders.router)
app.include_router(dormitory.router)
