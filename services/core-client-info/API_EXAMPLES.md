# API Examples for Production Testing

Base URL: `https://your-domain.ru/core-client-info`

## Test Data

After running the `001_add_test_data` migration, the database contains test data for:

- **Test User ID:** `550e8400-e29b-41d4-a716-446655440000`
- **JWT Token (valid until 2029):**
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo
  ```

This JWT contains:

- `sub`: 1
- `email`: vsevolod.bulgakov@example.com
- `name`: Всеволод Булгаков
- `role`: user
- Signed with local secret: `local-development-secret`

See `JWT_FORMAT.md` for details on JWT structure and how to generate custom tokens.

**For convenience, set as environment variable:**

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"
```

---

## Health Check

```bash
curl -X GET "https://your-domain.ru/core-client-info/status"
```

Expected response:

```json
{ "status": "ok", "service": "core-client-info" }
```

---

## Profile Endpoints

### Get User Basic Info

```bash
curl -X GET "https://your-domain.ru/core-client-info/profile/user?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Get Personal Data (Full Profile)

```bash
curl -X GET "https://your-domain.ru/core-client-info/profile/personal-data?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (based on test data):

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Всеволод",
    "last_name": "Булгаков",
    "middle_name": "Денисович",
    "avatar": null,
    "birth_date": null,
    "snils": null,
    "snils_issue_date": null,
    "region": null
  },
  "academic_info": [
    { "label": "Учебное заведение", "value": "Университет телекоммуникаций" },
    { "label": "Факультет", "value": "ИТПИ" },
    { "label": "Специальность", "value": "09.03.04 - Программная инженерия" },
    { "label": "Группа", "value": "ИКПИ-25" },
    { "label": "Курс", "value": "4" },
    { "label": "Форма обучения", "value": "Очная" },
    { "label": "Средний балл", "value": "4.75" }
  ]
}
```

---

## Settings Endpoints

### Get User Settings

```bash
curl -X GET "https://your-domain.ru/core-client-info/settings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
{
  "is_new_message_notifications_enabled": true,
  "is_schedule_change_notifications_enabled": true,
  "telegram_token": null,
  "vk_token": null
}
```

### Update Settings

```bash
curl -X PUT "https://your-domain.ru/core-client-info/settings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_new_message_notifications_enabled": false, "telegram_token": "test_token_123"}'
```

### Change Email (Step 1 - Request 2FA)

```bash
curl -X POST "https://your-domain.ru/core-client-info/settings/email?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_email": "newemail@example.com"}'
```

Expected response:

```json
{ "status": "need2fa", "message": "Код подтверждения отправлен на текущий email" }
```

### Change Email (Step 2 - Confirm with Code)

```bash
curl -X POST "https://your-domain.ru/core-client-info/settings/email?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_email": "newemail@example.com", "confirmation_code": "123456"}'
```

---

## Rating Endpoints

### Get Student Stats

```bash
curl -X GET "https://your-domain.ru/core-client-info/rating/stats?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
{
  "course": 4,
  "faculty": "ИТПИ",
  "specialty": "09.03.04 - Программная инженерия",
  "group": "ИКПИ-25",
  "average_grade": 4.75,
  "education_form": "Очная"
}
```

### Get Rating Level

```bash
curl -X GET "https://your-domain.ru/core-client-info/rating/level?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
{
  "level": "advanced",
  "current_xp": 850,
  "title": "Опытный",
  "color": "#9C27B0",
  "next_level_xp": 1000
}
```

### Get Rankings

```bash
curl -X GET "https://your-domain.ru/core-client-info/rating/rankings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
[
  { "ranking_type": "byCourse", "position": 5, "total": 120, "percentile": 95.83 },
  { "ranking_type": "byFaculty", "position": 15, "total": 500, "percentile": 97.0 },
  { "ranking_type": "byUniversity", "position": 42, "total": 5000, "percentile": 99.16 }
]
```

### Get Achievements

```bash
curl -X GET "https://your-domain.ru/core-client-info/rating/achievements?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
[
  {
    "achievement_id": "excellent_student",
    "unlocked": true,
    "unlocked_at": "2025-12-15T10:00:00Z",
    "progress": 1,
    "max_progress": 1,
    "times_earned": 2
  },
  {
    "achievement_id": "perfect_attendance",
    "unlocked": true,
    "unlocked_at": "2025-11-01T10:00:00Z",
    "progress": 1,
    "max_progress": 1,
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

### Get Streak

```bash
curl -X GET "https://your-domain.ru/core-client-info/rating/streak?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
{
  "current": 15,
  "best": 42,
  "last_updated": "2026-03-10T08:00:00Z"
}
```

### Get Grades

```bash
# All grades
curl -X GET "https://your-domain.ru/core-client-info/rating/grades?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Filter by period
curl -X GET "https://your-domain.ru/core-client-info/rating/grades?user_id=$USER_ID&period=last_session" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
[
  {
    "id": "77777777-7777-7777-7777-777777777777",
    "subject": "Математический анализ",
    "grade": 5.0,
    "grade_type": "exam",
    "grade_date": "2026-01-20T10:00:00Z"
  },
  {
    "id": "77777777-7777-7777-7777-777777777778",
    "subject": "Программирование",
    "grade": 5.0,
    "grade_type": "exam",
    "grade_date": "2026-01-22T14:00:00Z"
  },
  {
    "id": "77777777-7777-7777-7777-777777777779",
    "subject": "Базы данных",
    "grade": 4.0,
    "grade_type": "exam",
    "grade_date": "2026-01-25T10:00:00Z"
  },
  {
    "id": "77777777-7777-7777-7777-77777777777a",
    "subject": "Английский язык",
    "grade": 5.0,
    "grade_type": "credit",
    "grade_date": "2026-01-18T12:00:00Z"
  }
]
```

---

## References Endpoints

### Get All References

```bash
curl -X GET "https://your-domain.ru/core-client-info/references?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
[
  {
    "id": "88888888-8888-8888-8888-888888888888",
    "reference_type": "rdzd",
    "type_label": "РЖД",
    "status": "ready",
    "order_date": "2025-01-28T00:00:00Z",
    "pickup_point_id": "spbkt_hr",
    "virtual_only": false,
    "storage_until": "2025-02-14T00:00:00Z",
    "pdf_url": "/references/88888888-8888-8888-8888-888888888888/pdf"
  },
  {
    "id": "88888888-8888-8888-8888-888888888889",
    "reference_type": "study_confirmation",
    "type_label": "Справка об обучении",
    "status": "preparation",
    "order_date": "2026-03-09T00:00:00Z",
    "pickup_point_id": "spbkt_hr",
    "virtual_only": false,
    "storage_until": null,
    "pdf_url": null
  }
]
```

### Get Reference Details

```bash
curl -X GET "https://your-domain.ru/core-client-info/references/88888888-8888-8888-8888-888888888888?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Order New Reference

```bash
curl -X POST "https://your-domain.ru/core-client-info/references/order?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reference_type": "rdzd", "pickup_point_id": "spbkt_hr", "virtual_only": false}'
```

### Cancel Reference

```bash
curl -X POST "https://your-domain.ru/core-client-info/references/88888888-8888-8888-8888-888888888889/cancel?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## Orders Endpoints

### Get All Orders (with pagination)

```bash
# First page (default: 20 items)
curl -X GET "https://your-domain.ru/core-client-info/orders?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Filter by type
curl -X GET "https://your-domain.ru/core-client-info/orders?user_id=$USER_ID&type=scholarship,dormitory" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Pagination
curl -X GET "https://your-domain.ru/core-client-info/orders?user_id=$USER_ID&offset=20&limit=20" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
{
  "orders": [
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
      "notifications_count": 1
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
      "actions": null,
      "notifications_count": 1
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
      "actions": null,
      "notifications_count": 0
    }
  ],
  "total": 3,
  "has_more": false
}
```

### Get Orders Counts

```bash
curl -X GET "https://your-domain.ru/core-client-info/orders/counts?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
{
  "dormitory": 1,
  "scholarship": 1,
  "education": 1,
  "general": 0
}
```

### Get Order Details

```bash
curl -X GET "https://your-domain.ru/core-client-info/orders/99999999-9999-9999-9999-999999999999?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

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
      "severity": "info",
      "message": "Стипендия будет начислена 15 числа",
      "action": null
    }
  ]
}
```

---

## Subjects Endpoints

### Get Active Subject Choices

```bash
curl -X GET "https://your-domain.ru/core-client-info/subjects/choices" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
[
  {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "choice_id": "math_electives_2026",
    "deadline_date": "2026-04-01T23:59:59Z",
    "is_active": true
  }
]
```

### Get User Priorities for Choice

```bash
curl -X GET "https://your-domain.ru/core-client-info/subjects/user-priorities/math_electives_2026?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

Expected response (from test data):

```json
[
  {
    "choice_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "subject_id": "math-1",
    "priority": 0
  },
  {
    "choice_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "subject_id": "math-3",
    "priority": 1
  },
  {
    "choice_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "subject_id": "math-2",
    "priority": 2
  }
]
```

### Save Subject Priorities

```bash
curl -X POST "https://your-domain.ru/core-client-info/subjects/save-priorities?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"choice_id": "math_electives_2026", "priorities": ["math-1", "math-3", "math-2", "math-4"]}'
```

Expected response:

```json
{ "status": "success" }
```

---

## Dormitory Endpoint

### Upload Parent Agreement

```bash
curl -X POST "https://your-domain.ru/core-client-info/dormitory/parent-agreement?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/path/to/parent-agreement.pdf"
```

---

## Complete Test Scenarios

### Scenario 1: Check User Profile and Academic Info

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "=== Health Check ==="
curl -s "https://your-domain.ru/core-client-info/status" | jq .

echo -e "\n=== Student Stats ==="
curl -s "https://your-domain.ru/core-client-info/rating/stats?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Personal Data ==="
curl -s "https://your-domain.ru/core-client-info/profile/personal-data?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### Scenario 2: Check Gamification Features

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "=== Rating Level ==="
curl -s "https://your-domain.ru/core-client-info/rating/level?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Rankings ==="
curl -s "https://your-domain.ru/core-client-info/rating/rankings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Achievements ==="
curl -s "https://your-domain.ru/core-client-info/rating/achievements?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Streak ==="
curl -s "https://your-domain.ru/core-client-info/rating/streak?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Grades ==="
curl -s "https://your-domain.ru/core-client-info/rating/grades?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### Scenario 3: Check Orders and References

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "=== All Orders ==="
curl -s "https://your-domain.ru/core-client-info/orders?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Orders Counts ==="
curl -s "https://your-domain.ru/core-client-info/orders/counts?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Scholarship Order Details ==="
curl -s "https://your-domain.ru/core-client-info/orders/99999999-9999-9999-9999-999999999999?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== All References ==="
curl -s "https://your-domain.ru/core-client-info/references?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Ready Reference Details ==="
curl -s "https://your-domain.ru/core-client-info/references/88888888-8888-8888-8888-888888888888?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### Scenario 4: Check Subject Choices

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "=== Active Subject Choices ==="
curl -s "https://your-domain.ru/core-client-info/subjects/choices" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== User Subject Priorities ==="
curl -s "https://your-domain.ru/core-client-info/subjects/user-priorities/math_electives_2026?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### Scenario 5: Update Settings

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "=== Current Settings ==="
curl -s "https://your-domain.ru/core-client-info/settings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

echo -e "\n=== Update Settings ==="
curl -s -X PUT "https://your-domain.ru/core-client-info/settings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_new_message_notifications_enabled": false, "telegram_token": "test_telegram_token_123"}' | jq .

echo -e "\n=== Verify Updated Settings ==="
curl -s "https://your-domain.ru/core-client-info/settings?user_id=$USER_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

---

## Testing with httpx (Python)

```python
import httpx
import asyncio

BASE_URL = "https://your-domain.ru/core-client-info"
USER_ID = "550e8400-e29b-41d4-a716-446655440000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"

async def test_api():
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {TOKEN}"}

        # Health check
        response = await client.get(f"{BASE_URL}/status")
        print(f"Health: {response.json()}")

        # Get settings
        response = await client.get(
            f"{BASE_URL}/settings",
            params={"user_id": USER_ID},
            headers=headers
        )
        print(f"Settings: {response.json()}")

        # Get rating level
        response = await client.get(
            f"{BASE_URL}/rating/level",
            params={"user_id": USER_ID},
            headers=headers
        )
        print(f"Level: {response.json()}")

        # Get orders with filters
        response = await client.get(
            f"{BASE_URL}/orders",
            params={"user_id": USER_ID, "type": "scholarship", "limit": 5},
            headers=headers
        )
        print(f"Orders: {response.json()}")

        # Get all grades
        response = await client.get(
            f"{BASE_URL}/rating/grades",
            params={"user_id": USER_ID},
            headers=headers
        )
        print(f"Grades: {response.json()}")

        # Get achievements
        response = await client.get(
            f"{BASE_URL}/rating/achievements",
            params={"user_id": USER_ID},
            headers=headers
        )
        print(f"Achievements: {response.json()}")

asyncio.run(test_api())
```

---

## Quick Smoke Test Script

Save as `test-api.sh`:

```bash
#!/bin/bash
set -e

BASE_URL="https://your-domain.ru/core-client-info"
USER_ID="550e8400-e29b-41d4-a716-446655440000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"

echo "Testing core-client-info API with test data..."
echo

echo "1. Health check..."
curl -s "$BASE_URL/status" | jq .
echo

echo "2. Get settings..."
curl -s "$BASE_URL/settings?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "3. Get student stats..."
curl -s "$BASE_URL/rating/stats?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "4. Get rating level..."
curl -s "$BASE_URL/rating/level?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "5. Get rankings..."
curl -s "$BASE_URL/rating/rankings?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "6. Get achievements..."
curl -s "$BASE_URL/rating/achievements?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "7. Get streak..."
curl -s "$BASE_URL/rating/streak?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "8. Get grades..."
curl -s "$BASE_URL/rating/grades?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "9. Get orders counts..."
curl -s "$BASE_URL/orders/counts?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "10. Get all orders..."
curl -s "$BASE_URL/orders?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "11. Get scholarship order details..."
curl -s "$BASE_URL/orders/99999999-9999-9999-9999-999999999999?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "12. Get all references..."
curl -s "$BASE_URL/references?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "13. Get subject choices..."
curl -s "$BASE_URL/subjects/choices" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "14. Get user subject priorities..."
curl -s "$BASE_URL/subjects/user-priorities/math_electives_2026?user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "All tests completed successfully!"
```

Make executable: `chmod +x test-api.sh`

Run: `./test-api.sh`

---

## Metrics Endpoint

```bash
# Check Prometheus metrics (on separate port 9464)
curl -X GET "http://your-pod-ip:9464/metrics"
```

Expected metrics include:

- `http_server_duration_bucket` — request latency histogram
- `http_server_duration_count` — request count
- `process_resident_memory_bytes` — memory usage
- `process_cpu_seconds_total` — CPU usage

---

## Testing Locally (Development)

For local testing, replace the base URL with `http://localhost:8000`:

```bash
export BASE_URL="http://localhost:8000"
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo"
export USER_ID="550e8400-e29b-41d4-a716-446655440000"

# Run any of the examples above with $BASE_URL
curl -s "$BASE_URL/status" | jq .
```

---

## Notes

- All test data IDs are deterministic for easy testing
- JWT token uses local development secret and is valid until 2029
- Test data includes realistic Russian university context
- All timestamps are in UTC with timezone info
- Use `jq` for pretty-printing JSON responses
