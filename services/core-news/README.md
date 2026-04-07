# core-news

news parsing and displaying service

## Tech Stack

- **FastAPI** — web framework
- **uvicorn** — ASGI server
- **SQLAlchemy** (async) + **asyncpg** — database ORM
- **Alembic** — database migrations
- **OpenTelemetry** — tracing, metrics (Prometheus on port 9464), logs (Loki via OTLP)

## Development

```bash
# Install dependencies
uv sync

# Copy environment variables
cp .env.example .env

# Run development server
uv run uvicorn app.main:app --reload --port 8008
```

## Database Migrations

```bash
# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

## API Documentation

After starting the server, API docs are available at:

- Swagger UI: http://localhost:8008/core-news/docs
- ReDoc: http://localhost:8008/core-news/redoc

## Health Check

```
GET /core-news/api/status
```

## Metrics

Prometheus metrics are exposed on port `9464` at `/metrics`.
