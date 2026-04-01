from contextlib import asynccontextmanager

from _auth_routes_generated import AUTH_ROUTES
from authorization_py.middleware import AuthMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.instrumentation import instrument_app, setup_instrumentation
from app.routers import status, upload
from app.s3 import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_bucket()
    yield


setup_instrumentation()

app = FastAPI(
    title="system-files-storage",
    description="File storage service — upload files to MinIO, generate thumbnails",
    version="0.1.0",
    root_path="/system-files-storage",
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
app.include_router(upload.router)
