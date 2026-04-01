# OPTIMISATION — core-schedule

## Что уже есть в БД (проверено по SQL)
- Есть индексы: `semester(is_active)`, `schedule_template(semester_id, group_name)`, `schedule_template(semester_id, teacher_id)`, `schedule_override(semester_id, date, group_name)`, `session_event(semester_id, group_name)`, `session_event(semester_id, teacher_id)`.
- Есть уникальности: `uq_template_slot` и `uq_override_slot` (защита от дублей расписания/override).
- Связи `semester -> template/override/session_event` через FK с `ON DELETE CASCADE` настроены корректно.

## GET /api/status
- Оптимизировать нечего.

## GET /caldav/{token}/groups/{group_name}/calendar.ics
- По данным расписания индексы есть.
- Для session events по дате полезно добавить `(semester_id, group_name, date)`.
- Критично кэшировать готовый ICS (без этого CPU сериализации доминирует).

## GET /caldav/{token}/teachers/{teacher_id}/calendar.ics
- Добавить `(semester_id, teacher_id, date)` для `session_event`.
- Для template уже есть `(semester_id, teacher_id)`.

## GET /groups
- Если запрашивается DISTINCT group_name из `schedule_template`, текущий индекс частично помогает.
- Для частых выборок можно добавить отдельный индекс `schedule_template(group_name)`.

## GET /groups/{group_name}/schedule
- Базовый индекс `(semester_id, group_name)` есть.
- Для сортировки по дню/слоту добавить `(semester_id, group_name, day_of_week, slot_number)`.

## GET /groups/{group_name}/exams
- Сейчас нет отдельного индекса по `session_event.date` вместе с group.
- Добавить `(semester_id, group_name, date)`.

## GET /groups/{group_name}/template
- Индекс `(semester_id, group_name)` уже покрывает базовый кейс.

## GET /teachers/{teacher_id}/schedule
- Индекс `(semester_id, teacher_id)` есть.
- Для сортировки добавить `(semester_id, teacher_id, day_of_week, slot_number)`.

## GET /teachers/{teacher_id}/exams
- Добавить `(semester_id, teacher_id, date)` для `session_event`.

## GET /teachers/{teacher_id}/template
- Индекс `(semester_id, teacher_id)` уже есть.

## ADMIN ручки (`classrooms`, `semesters`, `templates`, `overrides`, `session-events`)
- CRUD по PK уже быстрый.
- Для списков с фильтрами по дате/группе/преподавателю нужны составные индексы, перечисленные выше.
- Для bulk (`POST /admin/templates/bulk`) оптимизация в batched upsert + разумный размер пакета.

## Настройка сервиса в целом
- Схема в целом хорошая; не хватает индексов с `date` и индексов под сортировку day/slot для шаблонов.
- Для реального ускорения выдачи календарей важнее всего кеш ICS + кеш resolved расписания.
