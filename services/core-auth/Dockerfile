FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_ENV=production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

EXPOSE 8002

WORKDIR /app

COPY services/core-auth/pyproject.toml services/core-auth/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY services/core-auth/app ./app
COPY services/core-auth/alembic.ini ./alembic.ini
COPY services/core-auth/alembic ./alembic

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
