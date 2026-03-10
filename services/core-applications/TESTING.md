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

The service will be available at `http://localhost:8001/core-applications`

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
export USER_ID="550e8400-e29b-41d4-a716-446655440000"
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJuYW1lIjoi0KLQtdGB0YLQvtCy0YvQuSDQn9C-0LvRjNC30L7QstCw0YLQtdC70YwiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTcwOTU1NjAwMCwiZXhwIjoxOTY3MjM2MDAwfQ.xJZG5Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0Y9Z0"
```

### Applications

```bash
# Get all applications
curl "http://localhost:8001/core-applications/applications?user_id=$USER_ID"

# Get scholarship applications
curl "http://localhost:8001/core-applications/applications?user_id=$USER_ID&type=scholarship"

# Get single application
curl "http://localhost:8001/core-applications/applications?user_id=$USER_ID&id=dddddddd-dddd-dddd-dddd-dddddddddddd"

# Get all notifications
curl "http://localhost:8001/core-applications/applications/notifications?user_id=$USER_ID"

# Get notifications for specific application
curl "http://localhost:8001/core-applications/applications/notifications?user_id=$USER_ID&application_id=dddddddd-dddd-dddd-dddd-ddddddddddde"
```

### References

```bash
# Get all references
curl "http://localhost:8001/core-applications/references?user_id=$USER_ID"

# Get single reference
curl "http://localhost:8001/core-applications/references/88888888-8888-8888-8888-888888888888?user_id=$USER_ID"

# Create new reference order
curl -X POST "http://localhost:8001/core-applications/references/order" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'$USER_ID'",
    "reference_type": "study_confirmation",
    "pickup_point_id": "spbkt_hr"
  }'
```

### Orders

```bash
# Get all orders
curl "http://localhost:8001/core-applications/orders?user_id=$USER_ID"

# Get orders by type
curl "http://localhost:8001/core-applications/orders?user_id=$USER_ID&type=scholarship"

# Get order counts
curl "http://localhost:8001/core-applications/orders/counts?user_id=$USER_ID"

# Get single order with notifications
curl "http://localhost:8001/core-applications/orders/99999999-9999-9999-9999-999999999999?user_id=$USER_ID"
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
