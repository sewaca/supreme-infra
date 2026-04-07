FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_ENV=production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

EXPOSE 8008

WORKDIR /app/services/core-news

COPY packages/authorization-py /app/packages/authorization-py

COPY services/core-news/pyproject.toml services/core-news/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY services/core-news/app ./app
COPY services/core-news/_auth_routes_generated.py ./_auth_routes_generated.py
COPY services/core-news/alembic.ini ./alembic.ini
COPY services/core-news/alembic ./alembic

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8008"]
