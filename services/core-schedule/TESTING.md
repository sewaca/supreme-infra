# Testing core-schedule

Quick guide for local testing of the core-schedule service.

## Setup

1. Install dependencies:

```bash
uv sync
```

2. Start PostgreSQL database (or use existing one):

```bash
docker-compose -f infra/databases/core-schedule-db/docker-compose.yml up -d
```

3. Run migrations:

```bash
uv run alembic upgrade head
```

4. Start the service:

```bash
uv run uvicorn app.main:app --reload --port 8003
```

The service will be available at `https://diploma.sewaca.ru/core-schedule`

## Test Data

The database is initialized with test data:

- **Semester**: `a0000000-0000-0000-0000-000000000001` ("Весна 2026", 16.01–15.04.2026, anchor: 23.03.2026)
- **Group**: `ИКПИ-25`

### Classrooms:

233, 235, 258, 374, 441, 460, 462, 700

### Teachers (teacher_cache):

| UUID               | ФИО             |
| ------------------ | --------------- |
| `d0000000-...-001` | Коробов С.А.    |
| `d0000000-...-002` | Бондаренко И.Б. |
| `d0000000-...-003` | Михайлов В.Д.   |
| `d0000000-...-004` | Усков М.В.      |
| `d0000000-...-005` | Вивчарь Р.М.    |
| `d0000000-...-006` | Гулькина Д.Н.   |
| `d0000000-...-007` | Смирнов К.А.    |
| `d0000000-...-008` | Белая Т.И.      |
| `d0000000-...-009` | Леонов А.С.     |

### Session events:

- Зачёт: Проектирование и архитектура ПС (16.04)
- Зачёт: Процессы жизненного цикла ПО (18.04)
- Зачёт: Математические методы (21.04)
- Консультация: Сетевое ПО (24.04)
- Экзамен: Сетевое ПО (25.04)

## Quick Tests

Set environment variables:

```bash
export BASE_URL="https://diploma.sewaca.ru/core-schedule"
export SEMESTER_ID="a0000000-0000-0000-0000-000000000001"
export USKOV_ID="d0000000-0000-0000-0000-000000000004"
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJqdGkiOiI5NzdiYWFkZS0wNTVkLTQ4NzEtYjYxZi03NTgxOWZjMjhhZjgiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwibmFtZSI6IkFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzc0NDg4NzAwLCJleHAiOjE3NzUwOTM1MDB9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Group schedule (week 1)

```bash
# Get schedule for group ИКПИ-25, week of 23.03.2026 (Week 1)
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/groups/%D0%98%D0%9A%D0%9F%D0%98-25/schedule?date_from=2026-03-23&date_to=2026-03-28" | jq .
```

```json
[
  {
    "date": "2026-03-23",
    "day_of_week": 0,
    "day_name": "Понедельник",
    "lessons": [
      {
        "slot_number": 3,
        "start_time": "13:00",
        "end_time": "14:35",
        "subject_name": "Математические методы и алгоритмы функционирования киберфизических систем",
        "lesson_type": "Практическое занятие",
        "teacher_id": "d0000000-0000-0000-0000-000000000001",
        "teacher_name": "Коробов С.А.",
        "group_name": "ИКПИ-25",
        "classroom_name": "258",
        "is_override": false,
        "override_comment": null
      }
    ]
  }
]
```

### Group schedule (week 2 — differences)

```bash
# Week 2: Monday slot 3 is "Лабораторная работа" instead of "Практическое занятие"
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/groups/%D0%98%D0%9A%D0%9F%D0%98-25/schedule?date_from=2026-03-30&date_to=2026-03-30" | jq '.[0].lessons[0].lesson_type'
# Expected: "Лабораторная работа"
```

### Group exams

```bash
# Get exams/credits for group ИКПИ-25
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/groups/%D0%98%D0%9A%D0%9F%D0%98-25/exams" | jq .
```

```json
[
  {
    "id": "e0000000-0000-0000-0000-000000000001",
    "semester_id": "a0000000-0000-0000-0000-000000000001",
    "date": "2026-04-16",
    "slot_number": 4,
    "start_time": "14:45",
    "end_time": "16:20",
    "subject_name": "Проектирование и архитектура программных систем",
    "lesson_type": "Зачёт",
    "teacher_id": "d0000000-0000-0000-0000-000000000007",
    "teacher_name": "Смирнов К.А.",
    "group_name": "ИКПИ-25",
    "classroom_name": "233"
  }
]
```

### Group template (base two-week pattern)

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/groups/%D0%98%D0%9A%D0%9F%D0%98-25/template" | jq '.week_1 | length'
# Expected: 6 (Mon-Sat)
```

### Teacher schedule (by UUID)

```bash
# Get schedule for Усков М.В. (Thursday lectures)
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/teachers/$USKOV_ID/schedule?date_from=2026-03-26&date_to=2026-03-26" | jq .
```

```json
[
  {
    "date": "2026-03-26",
    "day_of_week": 3,
    "day_name": "Четверг",
    "lessons": [
      {
        "slot_number": 2,
        "start_time": "10:45",
        "end_time": "12:20",
        "subject_name": "Сетевое программное обеспечение",
        "lesson_type": "Лекция",
        "teacher_id": "d0000000-0000-0000-0000-000000000004",
        "teacher_name": "Усков М.В.",
        "group_name": "ИКПИ-25",
        "classroom_name": "441",
        "is_override": false,
        "override_comment": null
      }
    ]
  }
]
```

### Teacher exams

```bash
# Get exams for Усков М.В.
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/teachers/$USKOV_ID/exams" | jq '. | length'
# Expected: 2 (consultation + exam)
```

### Sync teacher cache

```bash
# Upsert teachers into local cache
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$BASE_URL/admin/teachers/sync" \
  -d '{"items": [{"id": "d0000000-0000-0000-0000-000000000004", "name": "Усков М.В."}]}' | jq .
```

### Health check

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/status" | jq .
```

```json
{
  "status": "ok",
  "service": "core-schedule"
}
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Check PostgreSQL is running: `docker ps | grep core-schedule`
2. Verify credentials in `.env` file
3. Check database exists: `psql -h localhost -U core_schedule_user -d core_schedule_db -c '\dt'`

### Port Already in Use

If port 8003 or 9464 (metrics) is already in use:

```bash
# Find process using port
lsof -ti:8003
lsof -ti:9464

# Kill process
kill $(lsof -ti:8003)
kill $(lsof -ti:9464)
```

### No Test Data

If endpoints return empty results:

1. Check if `init.sql` was executed (only runs on first DB creation)
2. Manually run seed: `psql -h localhost -U core_schedule_user -d core_schedule_db -f infra/databases/core-schedule-db/migrations/001_seed_mock_data.sql`
3. Or recreate database:

```bash
docker-compose -f infra/databases/core-schedule-db/docker-compose.yml down -v
docker-compose -f infra/databases/core-schedule-db/docker-compose.yml up -d
```

### URL encoding for Cyrillic

Group names contain Cyrillic characters. In curl, use URL-encoded forms:

- `ИКПИ-25` → `%D0%98%D0%9A%D0%9F%D0%98-25`

Teacher endpoints now use UUID, no encoding needed.
