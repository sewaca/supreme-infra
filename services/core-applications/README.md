# core-applications

Applications service — manages user applications, references, orders, and dormitory operations.

## Overview

This service handles:

- **Applications (USER_APPLICATION)** — scholarship and dormitory applications
- **Application Notifications** — notifications for applications
- **References (REFERENCE_ORDER)** — document reference orders (РЖД, справки об обучении, etc.)
- **Orders (ORDER)** — administrative orders (приказы о стипендии, общежитии, переводе)
- **Dormitory** — parent agreement uploads

## Technology Stack

- **FastAPI** — modern Python web framework
- **SQLAlchemy** — async ORM for PostgreSQL
- **Alembic** — database migrations
- **OpenTelemetry** — observability (traces, metrics, logs)
- **Prometheus** — metrics export on port 9464
- **uv** — fast Python package manager

## Development

### Prerequisites

- Python 3.12+
- PostgreSQL 14+
- uv package manager

### Setup

1. Install dependencies:

```bash
uv sync
```

2. Configure environment:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run migrations:

```bash
uv run alembic upgrade head
```

4. Start development server:

```bash
uv run uvicorn app.main:app --reload --port 8001
```

The service will be available at `http://localhost:8001/core-applications`

## API Endpoints

### Applications

- `GET /applications` — list user applications (filterable by type, single by id)
- `GET /applications/notifications` — list notifications (filterable by type, application_id)

### References (Справки)

- `GET /references` — list reference orders
- `GET /references/:id` — reference details
- `POST /references/order` — create new reference order
- `POST /references/:id/cancel` — cancel reference
- `POST /references/:id/extend-storage` — extend storage period
- `GET /references/:id/pdf` — download PDF

### Orders (Приказы)

- `GET /orders` — list orders (filterable by type, paginated)
- `GET /orders/counts` — counts by type
- `GET /orders/:id` — order details with notifications
- `GET /orders/:id/pdf` — download PDF

### Dormitory

- `POST /dormitory/parent-agreement` — upload parent agreement

## Health Check

```
GET /core-applications/status
```

## Metrics

Prometheus metrics are exposed on port `9464` at `/metrics`.

## Database

The service uses PostgreSQL database `core_applications_db` with tables:

- `user_application` — applications
- `application_notification` — application notifications
- `reference_order` — reference orders
- `order` — administrative orders
- `order_notification` — order notifications

## Testing

See `TESTING.md` for testing instructions and test data.
