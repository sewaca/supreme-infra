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
- **Group**: `Б22/2`

### Classrooms:

233, 235, 258, 374, 441, 460, 462, 700

### Teachers:

Коробов С.А., Бондаренко И.Б., Михайлов В.Д., Усков М.В., Вивчарь Р.М., Гулькина Д.Н., Смирнов К.А., Белая Т.И., Леонов А.С.

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
```

### Group schedule (week 1)

```bash
# Get schedule for group Б22/2, week of 23.03.2026 (Week 1)
curl "$BASE_URL/groups/%D0%9122%2F2/schedule?date_from=2026-03-23&date_to=2026-03-28" | jq .
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
        "teacher_name": "Коробов С.А.",
        "group_name": "Б22/2",
        "classroom_name": "258",
        "is_override": false,
        "override_comment": null
      },
      {
        "slot_number": 4,
        "start_time": "14:45",
        "end_time": "16:20",
        "subject_name": "Проектирование и архитектура программных систем",
        "lesson_type": "Практическое занятие",
        "teacher_name": "Бондаренко И.Б.",
        "group_name": "Б22/2",
        "classroom_name": "233",
        "is_override": false,
        "override_comment": null
      },
      {
        "slot_number": 5,
        "start_time": "16:30",
        "end_time": "18:05",
        "subject_name": "Проектирование и архитектура программных систем",
        "lesson_type": "Лабораторная работа",
        "teacher_name": "Бондаренко И.Б.",
        "group_name": "Б22/2",
        "classroom_name": "233",
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
curl "$BASE_URL/groups/%D0%9122%2F2/schedule?date_from=2026-03-30&date_to=2026-03-30" | jq '.[0].lessons[0].lesson_type'
# Expected: "Лабораторная работа"
```

### Group exams

```bash
# Get exams/credits for group Б22/2
curl "$BASE_URL/groups/%D0%9122%2F2/exams" | jq .
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
    "teacher_name": "Смирнов К.А.",
    "group_name": "Б22/2",
    "classroom_name": "233"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000002",
    "semester_id": "a0000000-0000-0000-0000-000000000001",
    "date": "2026-04-18",
    "slot_number": 3,
    "start_time": "13:00",
    "end_time": "14:35",
    "subject_name": "Процессы жизненного цикла программного обеспечения",
    "lesson_type": "Зачёт",
    "teacher_name": "Белая Т.И.",
    "group_name": "Б22/2",
    "classroom_name": "235"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000003",
    "semester_id": "a0000000-0000-0000-0000-000000000001",
    "date": "2026-04-21",
    "slot_number": 2,
    "start_time": "10:45",
    "end_time": "12:20",
    "subject_name": "Математические методы и алгоритмы функционирования киберфизических систем",
    "lesson_type": "Зачёт",
    "teacher_name": "Вивчарь Р.М.",
    "group_name": "Б22/2",
    "classroom_name": "235"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000004",
    "semester_id": "a0000000-0000-0000-0000-000000000001",
    "date": "2026-04-24",
    "slot_number": null,
    "start_time": "16:30",
    "end_time": "17:15",
    "subject_name": "Сетевое программное обеспечение",
    "lesson_type": "Консультация",
    "teacher_name": "Усков М.В.",
    "group_name": "Б22/2",
    "classroom_name": "462"
  },
  {
    "id": "e0000000-0000-0000-0000-000000000005",
    "semester_id": "a0000000-0000-0000-0000-000000000001",
    "date": "2026-04-25",
    "slot_number": null,
    "start_time": "10:45",
    "end_time": "14:35",
    "subject_name": "Сетевое программное обеспечение",
    "lesson_type": "Экзамен",
    "teacher_name": "Усков М.В.",
    "group_name": "Б22/2",
    "classroom_name": "462"
  }
]
```

### Group template (base two-week pattern)

```bash
curl "$BASE_URL/groups/%D0%9122%2F2/template" | jq '.week_1 | length'
# Expected: 6 (Mon-Sat)

curl "$BASE_URL/groups/%D0%9122%2F2/template" | jq '.week_2 | length'
# Expected: 6 (Mon-Sat)
```

### Teacher schedule

```bash
# Get schedule for Усков М.В. (Thursday lectures)
curl "$BASE_URL/teachers/%D0%A3%D1%81%D0%BA%D0%BE%D0%B2%20%D0%9C.%D0%92./schedule?date_from=2026-03-26&date_to=2026-03-26" | jq .
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
        "teacher_name": "Усков М.В.",
        "group_name": "Б22/2",
        "classroom_name": "441",
        "is_override": false,
        "override_comment": null
      },
      {
        "slot_number": 3,
        "start_time": "13:00",
        "end_time": "14:35",
        "subject_name": "Программное обеспечение инфокоммуникационных сетей и систем",
        "lesson_type": "Лекция",
        "teacher_name": "Усков М.В.",
        "group_name": "Б22/2",
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
curl "$BASE_URL/teachers/%D0%A3%D1%81%D0%BA%D0%BE%D0%B2%20%D0%9C.%D0%92./exams" | jq '. | length'
# Expected: 2 (consultation + exam)
```

### Health check

```bash
curl "$BASE_URL/status" | jq .
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

Group and teacher names contain Cyrillic characters. In curl, use URL-encoded forms:

- `Б22/2` → `%D0%9122%2F2`
- `Усков М.В.` → `%D0%A3%D1%81%D0%BA%D0%BE%D0%B2%20%D0%9C.%D0%92.`

Or use `--data-urlencode` with query params.
