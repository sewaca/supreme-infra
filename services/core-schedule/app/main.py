from contextlib import asynccontextmanager

from _auth_routes_generated import AUTH_ROUTES
from authorization_py.middleware import AuthMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.instrumentation import instrument_app, setup_instrumentation
from app.routers import (
    admin_classrooms,
    admin_overrides,
    admin_semesters,
    admin_session_events,
    admin_teachers,
    admin_templates,
    caldav,
    groups,
    status,
    teachers,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


setup_instrumentation()

app = FastAPI(
    title="core-schedule",
    description="Schedule service — university timetable, templates, overrides",
    version="0.1.0",
    root_path="/core-schedule",
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
app.include_router(caldav.router)
app.include_router(groups.router)
app.include_router(teachers.router)
app.include_router(admin_classrooms.router)
app.include_router(admin_semesters.router)
app.include_router(admin_teachers.router)
app.include_router(admin_templates.router)
app.include_router(admin_overrides.router)
app.include_router(admin_session_events.router)
