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
export BASE_URL="https://diploma.sewaca.ru/core-client-info"
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MjgwODI5OCwiZXhwIjoxNzczNDEzMDk4fQ.dbmj5JTdOWEiRBOGKVYm_GWCNZQi4bJKPPo4mdIc_zI"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"
```

### Test All Endpoints

#### Status

```bash
curl -s "$BASE_URL/status" | jq .
```

```json
{ "status": "ok", "service": "core-client-info" }
```

#### Profile

```bash
# Get user profile
curl -s "$BASE_URL/profile/user?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Иван",
  "last_name": "Иванов",
  "middle_name": "Иванович",
  "avatar": null,
  "birth_date": "2000-01-15",
  "snils": "123-456-789 00",
  "snils_issue_date": "2015-06-01",
  "region": "Санкт-Петербург"
}
```

```bash
# Get personal data with academic info
curl -s "$BASE_URL/profile/personal-data?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Иван",
    "last_name": "Иванов",
    "middle_name": "Иванович",
    "avatar": null,
    "birth_date": "2000-01-15",
    "snils": "123-456-789 00",
    "snils_issue_date": "2015-06-01",
    "region": "Санкт-Петербург"
  },
  "academic_info": [
    { "label": "profile.academic.university", "value": "СПбГЭТУ «ЛЭТИ»" },
    { "label": "profile.academic.faculty", "value": "ИТПИ" },
    { "label": "profile.academic.course", "value": "4" }
  ]
}
```

#### Settings

```bash
# Get settings
curl -s "$BASE_URL/settings?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{
  "is_new_message_notifications_enabled": true,
  "is_schedule_change_notifications_enabled": true,
  "telegram_token": null,
  "vk_token": null
}
```

```bash
# Update settings
curl -s -X PUT "$BASE_URL/settings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_new_message_notifications_enabled": false}' | jq .
```

```json
{
  "is_new_message_notifications_enabled": false,
  "is_schedule_change_notifications_enabled": true,
  "telegram_token": null,
  "vk_token": null
}
```

```bash
# Change email (step 1 - request code)
curl -s -X POST "$BASE_URL/settings/email?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_email": "newemail@example.com"}' | jq .
```

```json
{ "status": "need2fa", "message": "Код подтверждения отправлен на текущий email" }
```

```bash
# Change password (step 1 - request code)
curl -s -X POST "$BASE_URL/settings/password?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password": "oldpass", "new_password": "newpass"}' | jq .
```

```json
{ "status": "need2fa", "message": "Код подтверждения отправлен на ваш email" }
```

#### Rating

```bash
# Student stats
curl -s "$BASE_URL/rating/stats?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{
  "course": 4,
  "faculty": "ИТПИ",
  "specialty": "Информатика и вычислительная техника",
  "direction": null,
  "profile": null,
  "group": "1234",
  "status": "active",
  "qualification": "bachelor",
  "average_grade": 4.75,
  "education_form": "full_time"
}
```

```bash
# Rating level (should show: advanced, 850 XP)
curl -s "$BASE_URL/rating/level?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{ "level": "advanced", "current_xp": 850 }
```

```bash
# Rankings (should show 3 positions)
curl -s "$BASE_URL/rating/rankings?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
[
  { "ranking_type": "byCourse", "position": 5, "total": 120, "percentile": 95.8 },
  { "ranking_type": "byFaculty", "position": 15, "total": 450, "percentile": 96.7 },
  { "ranking_type": "byUniversity", "position": 42, "total": 3500, "percentile": 98.8 }
]
```

```bash
# Achievements (should show 3: 2 unlocked, 1 in progress)
curl -s "$BASE_URL/rating/achievements?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
[
  {
    "achievement_id": "excellent_student",
    "unlocked": true,
    "unlocked_at": "2024-01-15T10:00:00Z",
    "progress": 10,
    "max_progress": 10,
    "times_earned": 2
  },
  {
    "achievement_id": "perfect_attendance",
    "unlocked": true,
    "unlocked_at": "2024-02-20T14:30:00Z",
    "progress": 30,
    "max_progress": 30,
    "times_earned": 1
  },
  {
    "achievement_id": "quick_learner",
    "unlocked": false,
    "unlocked_at": null,
    "progress": 7,
    "max_progress": 10,
    "times_earned": 0
  }
]
```

```bash
# Streak (current: 15, best: 42)
curl -s "$BASE_URL/rating/streak?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{ "current": 15, "best": 42, "last_updated": "2024-03-10T08:00:00Z" }
```

```bash
# Grades (should show 4 grades)
curl -s "$BASE_URL/rating/grades?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
[
  {
    "id": "77777777-7777-7777-7777-777777777777",
    "subject": "Математический анализ",
    "grade": 5.0,
    "grade_type": "exam",
    "grade_date": "2024-01-20"
  },
  {
    "id": "77777777-7777-7777-7777-777777777778",
    "subject": "Программирование",
    "grade": 5.0,
    "grade_type": "credit",
    "grade_date": "2024-01-18"
  },
  {
    "id": "77777777-7777-7777-7777-777777777779",
    "subject": "Базы данных",
    "grade": 5.0,
    "grade_type": "exam",
    "grade_date": "2024-01-15"
  },
  {
    "id": "77777777-7777-7777-7777-77777777777a",
    "subject": "Английский язык",
    "grade": 4.0,
    "grade_type": "exam",
    "grade_date": "2024-01-10"
  }
]
```

```bash
# Grades with period filter
curl -s "$BASE_URL/rating/grades?user_id=$USER_ID&period=last_session" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
[
  {
    "id": "77777777-7777-7777-7777-777777777777",
    "subject": "Математический анализ",
    "grade": 5.0,
    "grade_type": "exam",
    "grade_date": "2024-01-20"
  }
]
```

```bash
# Grade improvements (not implemented yet)
curl -s "$BASE_URL/rating/grade-improvements?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
{ "detail": "grade_improvements not implemented" }
```

#### Subjects

```bash
# Subject choices (should show 1 active choice)
curl -s "$BASE_URL/subjects/choices" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
[
  {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "choice_id": "math_electives_2026",
    "deadline_date": "2026-09-01",
    "is_active": true
  }
]
```

```bash
# User priorities (should show 3 subjects)
curl -s "$BASE_URL/subjects/user-priorities/math_electives_2026?user_id=$USER_ID" -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

```json
[
  { "choice_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "subject_id": "advanced_calculus", "priority": 0 },
  { "choice_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "subject_id": "linear_algebra", "priority": 1 },
  { "choice_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "subject_id": "discrete_math", "priority": 2 }
]
```

```bash
# Save priorities
curl -s -X POST "$BASE_URL/subjects/save-priorities?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"choice_id": "math_electives_2026", "priorities": ["advanced_calculus", "linear_algebra", "discrete_math"]}' | jq .
```

```json
{ "status": "success" }
```

## Expected Test Data Summary

After running migrations, you should have:

- **User Profile:** Full name, birth date, SNILS
- **Settings:** Notifications enabled, no tokens
- **Student Stats:** Course 4, ИТПИ, average 4.75
- **Rating Level:** Advanced (850/1000 XP)
- **Rankings:** 3 positions (by course, faculty, university)
- **Achievements:** 3 total (2 unlocked, 1 in progress)
- **Streak:** Current 15 days, best 42 days
- **Grades:** 4 grades (3 exams with 5.0, 1 credit with 5.0, 1 exam with 4.0)
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
