FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_ENV=production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

EXPOSE 8001

WORKDIR /app

COPY services/core-applications/pyproject.toml services/core-applications/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY services/core-applications/app ./app
COPY services/core-applications/alembic.ini ./alembic.ini
COPY services/core-applications/alembic ./alembic

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
