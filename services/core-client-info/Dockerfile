FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_ENV=production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

EXPOSE 8000

WORKDIR /app/services/core-client-info

COPY packages/authorization-py /app/packages/authorization-py

COPY services/core-client-info/pyproject.toml services/core-client-info/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY services/core-client-info/app ./app
COPY services/core-client-info/_auth_routes_generated.py ./_auth_routes_generated.py
COPY services/core-client-info/alembic.ini ./alembic.ini
COPY services/core-client-info/alembic ./alembic

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
