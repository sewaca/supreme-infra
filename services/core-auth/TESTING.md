# Quick Testing Guide

## Setup Test Data

The database is automatically initialized with test data when deployed via Helm:

1. **Initial setup** (`init.sql`): Creates schema and tables on first database creation
2. **Migrations** (`migrations/*.sql`): Applied on every `helm upgrade` to ensure test data exists

### Manual setup (for local development)

```bash
cd services/core-auth
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8002
```

Tables are created automatically on startup via `Base.metadata.create_all`. To insert test data locally, run the migration SQL manually:

```bash
kubectl exec -n supreme-infra postgresql-core-auth-0 -- \
  psql -U core_auth_user -d core_auth_db \
  -f /docker-entrypoint-initdb.d/migrations/001_initial_test_data.sql
```

## Verify Test Data in Database

```bash
kubectl exec -n supreme-infra postgresql-core-auth-0 -- \
  psql -U core_auth_user -d core_auth_db \
  -c "SELECT id, email, name, role FROM auth_user;"
```

Expected output:

```
                  id                  |           email            |     name     |  role
--------------------------------------+----------------------------+--------------+---------
 550e8400-e29b-41d4-a716-446655440000 | ivan.ivanov@example.com    | Иван Иванов  | student
 550e8400-e29b-41d4-a716-446655440001 | admin@example.com          | Admin User   | admin
(2 rows)
```

If the data doesn't exist, check migration job logs:

```bash
kubectl logs -n supreme-infra -l app=postgresql-core-auth-migration --tail=50
```

## Quick Test Commands

### 1. Set up base URL

```bash
export BASE_URL="https://diploma.sewaca.ru/core-auth"
```

---

### Status

```bash
curl -s "$BASE_URL/status" | jq .
```

```json
{
  "status": "ok",
  "service": "core-auth"
}
```

---

### Login (student)

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "ivan.ivanov@example.com", "password": "password123"}' | jq .
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6Iml2YW4uaXZhbm92QGV4YW1wbGUuY29tIiwibmFtZSI6Ilx1MDQxOFx1MDQzMlx1MDQzMFx1MDQzZCBcdTA0MThcdTA0MzJcdTA0MzBcdTA0M2RcdTA0M2VcdTA0MzIiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc0NTAwMDAwMCwiZXhwIjoxNzQ1NjA0ODAwfQ.<signature>",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "ivan.ivanov@example.com",
    "name": "Иван Иванов",
    "role": "student"
  }
}
```

Save the token for subsequent requests:

```bash
export JWT_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "ivan.ivanov@example.com", "password": "password123"}' | jq -r '.access_token')
```

---

### Login (admin)

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' | jq .
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...<signature>",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

### Login — wrong password (401)

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "ivan.ivanov@example.com", "password": "wrongpassword"}' | jq .
```

```json
{
  "detail": "Invalid credentials"
}
```

---

### Login — user not found (401)

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "nobody@example.com", "password": "password123"}' | jq .
```

```json
{
  "detail": "Invalid credentials"
}
```

---

### Register (stub)

```bash
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "somepass", "name": "New User"}' | jq .
```

```json
{
  "message": "Registration successful"
}
```

---

### Get current user (me)

```bash
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "ivan.ivanov@example.com",
  "name": "Иван Иванов",
  "role": "student"
}
```

---

### Get current user — no token (403)

```bash
curl -s "$BASE_URL/auth/me" | jq .
```

```json
{
  "detail": "Not authenticated"
}
```

---

### Get current user — expired token (401)

```bash
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.invalid" | jq .
```

```json
{
  "detail": "Invalid token"
}
```

---

## JWT Payload Structure

The token returned by `/auth/login` has the following payload:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "ivan.ivanov@example.com",
  "name": "Иван Иванов",
  "role": "student",
  "iat": 1745000000,
  "exp": 1745604800
}
```

| Field   | Type           | Description                                   |
| ------- | -------------- | --------------------------------------------- |
| `sub`   | UUID string    | User ID — same UUID as in `core-client-info`  |
| `email` | string         | User email                                    |
| `name`  | string         | Display name                                  |
| `role`  | string         | `student` / `teacher` / `moderator` / `admin` |
| `iat`   | Unix timestamp | Issued at                                     |
| `exp`   | Unix timestamp | Expires at (7 days from issue)                |

---

## Test Users Reference

| ID                                     | Email                     | Password      | Role      |
| -------------------------------------- | ------------------------- | ------------- | --------- |
| `550e8400-e29b-41d4-a716-446655440000` | `ivan.ivanov@example.com` | `password123` | `student` |
| `550e8400-e29b-41d4-a716-446655440001` | `admin@example.com`       | `admin123`    | `admin`   |

---

## Troubleshooting

### Database connection issues

Check `.env` credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=core_auth_db
DB_USER=core_auth_user
DB_PASSWORD=dev_password
```

### JWT validation errors

Ensure `JWT_SECRET` in `.env` matches across services:

```env
JWT_SECRET=local-development-secret
```

### No test data

**Kubernetes:**

```bash
kubectl logs -n supreme-infra -l app=postgresql-core-auth-migration --tail=50

kubectl exec -n supreme-infra postgresql-core-auth-0 -- \
  psql -U core_auth_user -d core_auth_db \
  -c "SELECT id, email, role FROM auth_user;"
```

**Local:**

```bash
# Reapply tables + data
uv run alembic downgrade base
uv run alembic upgrade head
```

## See Also

- `README.md` — Service overview and setup
- `infra/databases/core-auth-db/` — Database schema and seed data
- `infra/databases/DATABASE_MIGRATIONS.md` — Migration system documentation
