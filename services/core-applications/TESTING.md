# Testing core-applications

Quick guide for local testing of the core-applications service.

## Setup

1. Install dependencies:

```bash
uv sync
```

2. Start PostgreSQL database (or use existing one):

```bash
# Using docker-compose from infra/databases/core-applications-db
docker-compose -f infra/databases/core-applications-db/docker-compose.yml up -d
```

3. Run migrations:

```bash
uv run alembic upgrade head
```

4. Start the service:

```bash
uv run uvicorn app.main:app --reload --port 8001
```

The service will be available at `https://diploma.sewaca.ru/core-applications`

## Test Data

The database is initialized with test data for user:

- **User ID**: `550e8400-e29b-41d4-a716-446655440000`

### Applications:

- Scholarship application: `dddddddd-dddd-dddd-dddd-dddddddddddd`
- Dormitory application: `dddddddd-dddd-dddd-dddd-ddddddddddde`

### References:

- РЖД reference (ready): `88888888-8888-8888-8888-888888888888`
- Study confirmation (preparation): `88888888-8888-8888-8888-888888888889`

### Orders:

- Scholarship order: `99999999-9999-9999-9999-999999999999`
- Dormitory order: `99999999-9999-9999-9999-99999999999a`
- Education order: `99999999-9999-9999-9999-99999999999b`

## Quick Tests

Set environment variables:

```bash
export BASE_URL="https://diploma.sewaca.ru/core-applications"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJuYW1lIjoi0KLQtdGB0YLQvtCy0YvQuSDQn9C-0LvRjNC30L7QstCw0YLQtdC70YwiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTcwOTU1NjAwMCwiZXhwIjoxOTY3MjM2MDAwfQ.xJZG5Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0"
```

### Applications

```bash
# Get all applications
curl "$BASE_URL/applications?user_id=$USER_ID" | jq .
```

```json
[
  {
    "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "type": "scholarship",
    "number": "СТ-2025-001",
    "additional_fields": {
      "amount": 5000.0,
      "currency": "RUB"
    },
    "start_date": "2025-09-01T00:00:00+00:00",
    "end_date": "2026-06-30T00:00:00+00:00",
    "is_active": true,
    "notifications_count": 1
  },
  {
    "id": "dddddddd-dddd-dddd-dddd-ddddddddddde",
    "type": "dormitory",
    "number": "ОБ-2022-042",
    "additional_fields": {
      "contractNumber": "ОБ-2022-042",
      "dormitoryName": "Общежитие №3",
      "address": "ул. Примерная, д. 10",
      "roomNumber": "305"
    },
    "start_date": "2022-09-01T00:00:00+00:00",
    "end_date": "2026-06-30T00:00:00+00:00",
    "is_active": true,
    "notifications_count": 2
  }
]
```

```bash
# Get scholarship applications
curl "$BASE_URL/applications?user_id=$USER_ID&type=scholarship" | jq .
```

```json
[
  {
    "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "type": "scholarship",
    "number": "СТ-2025-001",
    "additional_fields": {
      "amount": 5000.0,
      "currency": "RUB"
    },
    "start_date": "2025-09-01T00:00:00+00:00",
    "end_date": "2026-06-30T00:00:00+00:00",
    "is_active": true,
    "notifications_count": 1
  }
]
```

```bash
# Get single application
curl "$BASE_URL/applications?user_id=$USER_ID&id=dddddddd-dddd-dddd-dddd-dddddddddddd" | jq .
```

```json
{
  "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "type": "scholarship",
  "number": "СТ-2025-001",
  "additional_fields": {
    "amount": 5000.0,
    "currency": "RUB"
  },
  "start_date": "2025-09-01T00:00:00+00:00",
  "end_date": "2026-06-30T00:00:00+00:00",
  "is_active": true,
  "notifications_count": 1
}
```

```bash
# Get all notifications
curl "$BASE_URL/applications/notifications?user_id=$USER_ID" | jq .
```

```json
[
  {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "application_id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "severity": "info",
    "message": "Стипендия будет начислена 15 числа",
    "action": null,
    "created_at": "2026-03-11T10:00:00+00:00"
  },
  {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef",
    "application_id": "dddddddd-dddd-dddd-dddd-ddddddddddde",
    "severity": "warning",
    "message": "Необходимо оплатить проживание до 25 числа",
    "action": "/dormitory/payment",
    "created_at": "2026-03-11T10:00:00+00:00"
  },
  {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef0",
    "application_id": "dddddddd-dddd-dddd-dddd-ddddddddddde",
    "severity": "error",
    "message": "Требуется подписать дополнительное соглашение",
    "action": "/dormitory/sign-agreement",
    "created_at": "2026-03-11T10:00:00+00:00"
  }
]
```

```bash
# Get notifications for specific application
curl "$BASE_URL/applications/notifications?user_id=$USER_ID&application_id=dddddddd-dddd-dddd-dddd-ddddddddddde" | jq .
```

```json
[
  {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef",
    "application_id": "dddddddd-dddd-dddd-dddd-ddddddddddde",
    "severity": "warning",
    "message": "Необходимо оплатить проживание до 25 числа",
    "action": "/dormitory/payment",
    "created_at": "2026-03-11T10:00:00+00:00"
  },
  {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef0",
    "application_id": "dddddddd-dddd-dddd-dddd-ddddddddddde",
    "severity": "error",
    "message": "Требуется подписать дополнительное соглашение",
    "action": "/dormitory/sign-agreement",
    "created_at": "2026-03-11T10:00:00+00:00"
  }
]
```

### References

```bash
# Get all references
curl "$BASE_URL/references?user_id=$USER_ID" | jq .
```

```json
[
  {
    "id": "88888888-8888-8888-8888-888888888888",
    "reference_type": "rdzd",
    "type_label": "references.type.rdzd",
    "status": "ready",
    "order_date": "2025-01-28T00:00:00+00:00",
    "pickup_point_id": "spbkt_hr",
    "virtual_only": false,
    "storage_until": "2025-02-14T00:00:00+00:00",
    "pdf_url": "/references/88888888-8888-8888-8888-888888888888/pdf"
  },
  {
    "id": "88888888-8888-8888-8888-888888888889",
    "reference_type": "study_confirmation",
    "type_label": "references.type.study_confirmation",
    "status": "preparation",
    "order_date": "2026-03-09T00:00:00+00:00",
    "pickup_point_id": "spbkt_hr",
    "virtual_only": false,
    "storage_until": null,
    "pdf_url": null
  }
]
```

```bash
# Get single reference
curl "$BASE_URL/references/88888888-8888-8888-8888-888888888888?user_id=$USER_ID" | jq .
```

```json
{
  "id": "88888888-8888-8888-8888-888888888888",
  "reference_type": "rdzd",
  "type_label": "references.type.rdzd",
  "status": "ready",
  "order_date": "2025-01-28T00:00:00+00:00",
  "pickup_point_id": "spbkt_hr",
  "virtual_only": false,
  "storage_until": "2025-02-14T00:00:00+00:00",
  "pdf_url": "/references/88888888-8888-8888-8888-888888888888/pdf"
}
```

```bash
# Create new reference order
curl -X POST "$BASE_URL/references/order?user_id=$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "reference_type": "study_confirmation",
    "pickup_point_id": "spbkt_hr"
  }' | jq .
```

```json
{
  "id": "88888888-8888-8888-8888-88888888888a",
  "reference_type": "study_confirmation",
  "type_label": "references.type.study_confirmation",
  "status": "preparation",
  "order_date": "2026-03-11T12:00:00+00:00",
  "pickup_point_id": "spbkt_hr",
  "virtual_only": false,
  "storage_until": null,
  "pdf_url": null
}
```

### Orders

```bash
# Get all orders
curl "$BASE_URL/orders?user_id=$USER_ID" | jq .
```

```json
[
  {
    "id": "99999999-9999-9999-9999-999999999999",
    "type": "scholarship",
    "number": "250/кс",
    "title": "Назначить стипендию",
    "date": "2026-02-18",
    "additional_fields": {
      "comment": "№250/кс от 18.02.2026",
      "startDate": "2026-02-01",
      "endDate": "2026-04-30"
    },
    "pdf_url": "/orders/99999999-9999-9999-9999-999999999999/pdf",
    "actions": {
      "primary": {
        "title": "Скачать PDF",
        "action": "/orders/99999999-9999-9999-9999-999999999999/pdf"
      }
    }
  },
  {
    "id": "99999999-9999-9999-9999-99999999999a",
    "type": "dormitory",
    "number": "150/об",
    "title": "О заселении в общежитие",
    "date": "2025-09-01",
    "additional_fields": {
      "comment": "№150/об от 01.09.2025",
      "dormitoryAddress": "ул. Примерная, д. 10",
      "roomNumber": "305"
    },
    "pdf_url": "/orders/99999999-9999-9999-9999-99999999999a/pdf",
    "actions": null
  },
  {
    "id": "99999999-9999-9999-9999-99999999999b",
    "type": "education",
    "number": "75/уч",
    "title": "О переводе на следующий курс",
    "date": "2025-07-15",
    "additional_fields": {
      "comment": "№75/уч от 15.07.2025",
      "fromCourse": "3",
      "toCourse": "4"
    },
    "pdf_url": "/orders/99999999-9999-9999-9999-99999999999b/pdf",
    "actions": null
  }
]
```

```bash
# Get orders by type
curl "$BASE_URL/orders?user_id=$USER_ID&type=scholarship" | jq .
```

```json
[
  {
    "id": "99999999-9999-9999-9999-999999999999",
    "type": "scholarship",
    "number": "250/кс",
    "title": "Назначить стипендию",
    "date": "2026-02-18",
    "additional_fields": {
      "comment": "№250/кс от 18.02.2026",
      "startDate": "2026-02-01",
      "endDate": "2026-04-30"
    },
    "pdf_url": "/orders/99999999-9999-9999-9999-999999999999/pdf",
    "actions": {
      "primary": {
        "title": "Скачать PDF",
        "action": "/orders/99999999-9999-9999-9999-999999999999/pdf"
      }
    }
  }
]
```

```bash
# Get order counts
curl "$BASE_URL/orders/counts?user_id=$USER_ID" | jq .
```

```json
{
  "scholarship": 1,
  "dormitory": 1,
  "education": 1
}
```

```bash
# Get single order with notifications
curl "$BASE_URL/orders/99999999-9999-9999-9999-999999999999?user_id=$USER_ID" | jq .
```

```json
{
  "id": "99999999-9999-9999-9999-999999999999",
  "type": "scholarship",
  "number": "250/кс",
  "title": "Назначить стипендию",
  "date": "2026-02-18",
  "additional_fields": {
    "comment": "№250/кс от 18.02.2026",
    "startDate": "2026-02-01",
    "endDate": "2026-04-30"
  },
  "pdf_url": "/orders/99999999-9999-9999-9999-999999999999/pdf",
  "actions": {
    "primary": {
      "title": "Скачать PDF",
      "action": "/orders/99999999-9999-9999-9999-999999999999/pdf"
    }
  },
  "notifications": [
    {
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "order_id": "99999999-9999-9999-9999-999999999999",
      "severity": "info",
      "message": "Стипендия будет начислена 15 числа",
      "action": null,
      "created_at": "2026-03-11T10:00:00+00:00"
    }
  ]
}
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Check PostgreSQL is running: `docker ps | grep core-applications`
2. Verify credentials in `.env` file
3. Check database exists: `psql -h localhost -U core_applications_user -d core_applications_db -c '\dt'`

### Port Already in Use

If port 8001 or 9464 (metrics) is already in use:

```bash
# Find process using port
lsof -ti:8001
lsof -ti:9464

# Kill process
kill $(lsof -ti:8001)
kill $(lsof -ti:9464)
```

### No Test Data

If endpoints return empty results:

1. Check if `init.sql` was executed (only runs on first DB creation)
2. Manually run migration: `uv run alembic upgrade head`
3. Or recreate database:

```bash
docker-compose -f infra/databases/core-applications-db/docker-compose.yml down -v
docker-compose -f infra/databases/core-applications-db/docker-compose.yml up -d
```
