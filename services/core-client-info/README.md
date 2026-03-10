# core-client-info

Client information service — stores user profile, settings, ratings, achievements, grades, references, orders, and subject priorities.

## Tech Stack

- **FastAPI** — web framework
- **uvicorn** — ASGI server
- **SQLAlchemy** (async) + **asyncpg** — database ORM
- **Alembic** — database migrations
- **OpenTelemetry** — tracing, metrics (Prometheus on port 9464), logs (Loki via OTLP)

## Domain

This service owns all user data EXCEPT:

- Authentication (passwords, login sessions) — owned by `core-auth-bff`
- Applications/contracts (USER_APPLICATION, APPLICATION_NOTIFICATION) — owned by `core-auth-bff`

### Database Tables

| Table                   | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `user_settings`         | Notification preferences, SSO tokens (Telegram/VK)       |
| `student_stats`         | Academic info: faculty, course, group, GPA, etc.         |
| `rating_level`          | Gamification level and XP                                |
| `ranking_position`      | Positions in various rankings (by course, faculty, etc.) |
| `user_achievement`      | Earned achievements (config loaded from JSON)            |
| `streak`                | Attendance streak (current and best)                     |
| `user_grade`            | All grades for all subjects                              |
| `reference_order`       | Certificate orders (справки)                             |
| `order`                 | Administrative orders (приказы)                          |
| `order_notification`    | Notifications attached to orders                         |
| `subject_choice`        | Available elective subject choice groups                 |
| `user_subject_priority` | User's priority ordering for elective subjects           |

## Development

```bash
# Install dependencies
uv sync

# Copy environment variables
cp .env.example .env

# Run development server
uv run uvicorn app.main:app --reload --port 8000
```

## Database Migrations

```bash
# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

## API Documentation

After starting the server, API docs are available at:

- Swagger UI: http://localhost:8000/core-client-info/docs
- ReDoc: http://localhost:8000/core-client-info/redoc

## API Endpoints

### Profile

- `GET /api/profile/user` — basic user info
- `GET /api/profile/personal-data` — personal + academic data

### Settings

- `GET /api/settings` — get user settings
- `PUT /api/settings` — update settings
- `POST /api/settings/email` — change email (with 2FA)
- `POST /api/settings/password` — change password (with 2FA)

### Rating & Gamification

- `GET /api/rating/stats` — student stats
- `GET /api/rating/level` — XP level
- `GET /api/rating/rankings` — ranking positions
- `GET /api/rating/achievements` — achievements
- `GET /api/rating/streak` — attendance streak
- `GET /api/rating/grades` — all grades
- `GET /api/rating/grade-improvements` — recent grade improvements

### References (Справки)

- `GET /api/references` — list all references
- `GET /api/references/:id` — reference details
- `POST /api/references/order` — order new reference
- `POST /api/references/:id/cancel` — cancel order
- `POST /api/references/:id/extend-storage` — extend storage period
- `GET /api/references/:id/pdf` — download PDF

### Orders (Приказы)

- `GET /api/orders` — list orders (filterable by type, paginated)
- `GET /api/orders/counts` — counts by type
- `GET /api/orders/:id` — order details with notifications
- `GET /api/orders/:id/pdf` — download PDF

### Subjects

- `GET /api/subjects/choices` — active subject choices
- `GET /api/subjects/user-priorities/:choiceId` — user's priorities
- `POST /api/subjects/save-priorities` — save priority order

### Dormitory

- `POST /api/dormitory/parent-agreement` — upload parent agreement

## Health Check

```
GET /core-client-info/api/status
```

## Metrics

Prometheus metrics are exposed on port `9464` at `/metrics`.

## Testing

### Quick Start with Test Data

1. Run migrations to create tables and insert test data:

```bash
uv run alembic upgrade head
```

2. Start the service:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. Test with pre-configured data:

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

# Test endpoints
curl -s "http://localhost:8000/api/status" | jq .
curl -s "http://localhost:8000/api/rating/level?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### Documentation

- `TESTING.md` — Quick testing guide with setup instructions
- `API_EXAMPLES.md` — Complete API examples with test data
- `JWT_FORMAT.md` — JWT structure and token generation
