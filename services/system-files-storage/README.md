# system-files-storage

File storage service — upload files to MinIO, generate thumbnails

## Tech Stack

- **FastAPI** — web framework
- **uvicorn** — ASGI server
- **SQLAlchemy** (async) + **asyncpg** — database ORM
- **OpenTelemetry** — tracing, metrics (Prometheus on port 9464), logs (Loki via OTLP)

## Development

```bash
# Install dependencies
uv sync

# Copy environment variables
cp .env.example .env

# Run development server
uv run uvicorn app.main:app --reload --port 8007
```

## API Documentation

After starting the server, API docs are available at:

- Swagger UI: http://localhost:8007/core-files/docs
- ReDoc: http://localhost:8007/core-files/redoc

## Health Check

```
GET /core-files/api/status
```

## Metrics

Prometheus metrics are exposed on port `9464` at `/metrics`.
