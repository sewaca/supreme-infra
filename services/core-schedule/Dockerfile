FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_ENV=production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

EXPOSE 8003

WORKDIR /app

COPY services/core-schedule/pyproject.toml services/core-schedule/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY packages/authorization-py/authorization_py ./authorization_py
COPY services/core-schedule/app ./app
COPY services/core-schedule/_auth_routes_generated.py ./_auth_routes_generated.py
COPY services/core-schedule/alembic.ini ./alembic.ini
COPY services/core-schedule/alembic ./alembic

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
