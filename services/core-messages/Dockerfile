FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_ENV=production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

EXPOSE 8006

WORKDIR /app/services/core-messages

COPY packages/authorization-py /app/packages/authorization-py

COPY services/core-messages/pyproject.toml services/core-messages/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY services/core-messages/app ./app
COPY services/core-messages/_auth_routes_generated.py ./_auth_routes_generated.py

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8006"]
