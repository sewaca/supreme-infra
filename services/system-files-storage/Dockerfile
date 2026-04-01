FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHON_ENV=production

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

EXPOSE 8007

WORKDIR /app/services/system-files-storage

COPY packages/authorization-py /app/packages/authorization-py

COPY services/system-files-storage/pyproject.toml services/system-files-storage/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY services/system-files-storage/app ./app
COPY services/system-files-storage/_auth_routes_generated.py ./_auth_routes_generated.py

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8007"]
