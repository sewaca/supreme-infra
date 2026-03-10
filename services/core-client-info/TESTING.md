# Quick Testing Guide

## Setup Test Data

1. **Run database migrations:**

```bash
cd services/core-client-info
uv run alembic upgrade head
```

This will create all tables and insert test data for user `550e8400-e29b-41d4-a716-446655440000`.

2. **Start the service:**

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Quick Test Commands

Set up environment variables:

```bash
export BASE_URL="https://diploma.sewaca.ru"
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"
```

### Test All Endpoints

```bash
# Health
curl -s "$BASE_URL/status" | jq .

# Settings
curl -s "$BASE_URL/settings?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Student stats
curl -s "$BASE_URL/rating/stats?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Rating level (should show: advanced, 850 XP)
curl -s "$BASE_URL/rating/level?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Rankings (should show 3 positions)
curl -s "$BASE_URL/rating/rankings?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Achievements (should show 3: 2 unlocked, 1 in progress)
curl -s "$BASE_URL/rating/achievements?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Streak (current: 15, best: 42)
curl -s "$BASE_URL/rating/streak?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Grades (should show 4 grades)
curl -s "$BASE_URL/rating/grades?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Orders (should show 3 orders)
curl -s "$BASE_URL/orders?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Orders counts
curl -s "$BASE_URL/orders/counts?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# References (should show 2 references)
curl -s "$BASE_URL/references?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Subject choices (should show 1 active choice)
curl -s "$BASE_URL/subjects/choices" -H "Authorization: Bearer $JWT_TOKEN" | jq .

# User priorities (should show 3 subjects)
curl -s "$BASE_URL/subjects/user-priorities/math_electives_2026?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

## Expected Test Data Summary

After running migrations, you should have:

- **Settings:** Notifications enabled, no tokens
- **Student Stats:** Course 4, ИТПИ, average 4.75
- **Rating Level:** Advanced (850/1000 XP)
- **Rankings:** 3 positions (by course, faculty, university)
- **Achievements:** 3 total (2 unlocked, 1 in progress)
- **Streak:** Current 15 days, best 42 days
- **Grades:** 4 grades (3 exams with 5.0, 1 credit with 5.0, 1 exam with 4.0)
- **Orders:** 3 orders (scholarship, dormitory, education)
- **References:** 2 references (1 ready, 1 in preparation)
- **Subject Choice:** 1 active choice with 3 user priorities

## Test Data IDs Reference

```
User ID:           550e8400-e29b-41d4-a716-446655440000

Settings:          11111111-1111-1111-1111-111111111111
Student Stats:     22222222-2222-2222-2222-222222222222
Rating Level:      33333333-3333-3333-3333-333333333333
Streak:            66666666-6666-6666-6666-666666666666

Rankings:          44444444-4444-4444-4444-444444444444 (byCourse)
                   44444444-4444-4444-4444-444444444445 (byFaculty)
                   44444444-4444-4444-4444-444444444446 (byUniversity)

Achievements:      55555555-5555-5555-5555-555555555555 (excellent_student)
                   55555555-5555-5555-5555-555555555556 (perfect_attendance)
                   55555555-5555-5555-5555-555555555557 (quick_learner)

Grades:            77777777-7777-7777-7777-777777777777 (Математический анализ)
                   77777777-7777-7777-7777-777777777778 (Программирование)
                   77777777-7777-7777-7777-777777777779 (Базы данных)
                   77777777-7777-7777-7777-77777777777a (Английский язык)

References:        88888888-8888-8888-8888-888888888888 (РЖД - ready)
                   88888888-8888-8888-8888-888888888889 (Справка об обучении - preparation)

Orders:            99999999-9999-9999-9999-999999999999 (scholarship)
                   99999999-9999-9999-9999-99999999999a (dormitory)
                   99999999-9999-9999-9999-99999999999b (education)

Subject Choice:    bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb (math_electives_2026)
```

## Troubleshooting

### Database Connection Issues

Check your `.env` file has correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=core_client_info_db
DB_USER=core_client_info_user
DB_PASSWORD=your_password
```

### JWT Validation Errors

Ensure `JWT_SECRET` in `.env` matches the token secret:

```env
JWT_SECRET=local-development-secret
```

### No Test Data

If queries return empty results, re-run migrations:

```bash
uv run alembic downgrade base
uv run alembic upgrade head
```

## See Also

- `API_EXAMPLES.md` — Complete API documentation with all endpoints
- `JWT_FORMAT.md` — JWT structure and how to generate custom tokens
- `README.md` — Service overview and setup instructions
