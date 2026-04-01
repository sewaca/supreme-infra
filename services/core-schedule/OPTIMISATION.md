# OPTIMISATION — core-schedule

## Ручка `GET /api/status`
- Оптимизировать нечего.

## Ручка `GET /caldav/{token}/groups/{group_name}/calendar.ics`
- Критично кэшировать сгенерированный ICS (по token/group + короткий TTL).
- Валидацию token делать быстрым запросом с индексом на token в `core-auth`.
- Для генерации повторяющихся событий использовать precomputed intervals.

## Ручка `GET /caldav/{token}/teachers/{teacher_id}/calendar.ics`
- Аналогично group ICS: кэш + минимизация CPU на сериализацию.

## Ручка `GET /groups`
- Кэшировать список групп (обычно редко меняется).

## Ручка `GET /groups/{group_name}/schedule`
- Индексы на `(group_name, date)` для session/template/override таблиц.
- Рассмотреть pre-aggregation расписания на неделю/семестр.

## Ручка `GET /groups/{group_name}/exams`
- Индекс по `(group_name, exam_date)`.
- Если данные редки — оптимизировать нечего кроме индекса.

## Ручка `GET /groups/{group_name}/template`
- Быстрый read; оптимизация минимальная.

## Ручка `GET /teachers/{teacher_id}/schedule`
- Индексы `(teacher_id, date)` + keyset pagination при больших диапазонах.

## Ручка `GET /teachers/{teacher_id}/exams`
- Индекс `(teacher_id, exam_date)`.

## Ручка `GET /teachers/{teacher_id}/template`
- Оптимизировать почти нечего.

## Ручка `GET /admin/classrooms`
- Для административных списков при росте данных добавить пагинацию/фильтры.

## Ручка `POST /admin/classrooms`
- Write endpoint, прирост небольшой.

## Ручка `GET /admin/classrooms/{classroom_id}`
- Single-row, оптимизировать нечего.

## Ручка `PUT /admin/classrooms/{classroom_id}`
- Single-row update, оптимизация минимальна.

## Ручка `DELETE /admin/classrooms/{classroom_id}`
- Проверить отсутствие дорогих каскадов.

## Ручка `GET /admin/semesters`
- Как и admin lists: пагинация при росте данных.

## Ручка `POST /admin/semesters`
- Значимой оптимизации нет.

## Ручка `GET /admin/semesters/{semester_id}`
- Значимой оптимизации нет.

## Ручка `PUT /admin/semesters/{semester_id}`
- Значимой оптимизации нет.

## Ручка `DELETE /admin/semesters/{semester_id}`
- Значимой оптимизации нет.

## Ручка `GET /admin/teachers`
- Если идёт синхронизация с внешним источником — кэшировать локальную teacher cache.

## Ручка `POST /admin/teachers/sync`
- Выполнять как фоновой job с прогрессом, чтобы не держать HTTP запрос долго.

## Ручка `GET /admin/templates`
- Индекс по `(group_name/teacher_id, weekday, lesson_number)` в зависимости от модели.

## Ручка `POST /admin/templates`
- Для bulk-похожих операций использовать batch insert.

## Ручка `POST /admin/templates/bulk`
- **Высокий приоритет**: upsert пачкой + ограничение размера батча.

## Ручка `PUT /admin/templates/{template_id}`
- Существенного ускорения обычно нет.

## Ручка `DELETE /admin/templates/{template_id}`
- Существенного ускорения обычно нет.

## Ручка `GET /admin/overrides`
- Индекс по `(date, group_name/teacher_id)` обязателен.

## Ручка `POST /admin/overrides`
- Write path, оптимизации небольшие.

## Ручка `PUT /admin/overrides/{override_id}`
- Существенного ускорения обычно нет.

## Ручка `DELETE /admin/overrides/{override_id}`
- Существенного ускорения обычно нет.

## Ручка `GET /admin/session-events`
- Индекс по `(date, group_name/teacher_id, event_type)`.

## Ручка `POST /admin/session-events`
- Write path, оптимизации небольшие.

## Ручка `PUT /admin/session-events/{event_id}`
- Существенного ускорения обычно нет.

## Ручка `DELETE /admin/session-events/{event_id}`
- Существенного ускорения обычно нет.

## Настройка сервиса в целом
- Главные точки: выдача расписания/ICS и bulk админ-операции.
- Полезно ввести слой кэширования для read-heavy ручек (`groups/*/schedule`, `teachers/*/schedule`, CalDAV).
- Для sync/bulk задач — очереди и ограничение конкурентности.
