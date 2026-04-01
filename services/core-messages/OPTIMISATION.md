# OPTIMISATION — core-messages

## Ручка `GET /status`
- Оптимизировать нечего: это лёгкий health-check, влияние на общую latency сервиса минимальное.

## Ручка `GET /conversations`
- **Высокий приоритет**: убрать N+1 по unread_count. Сейчас для каждого диалога вызывается отдельный `COUNT(*)` по `message`; лучше считать unread одним SQL через `LEFT JOIN` + `GROUP BY` или CTE по списку conversation_id.
- **Высокий приоритет**: убрать N+1/доп. запросы на обогащение участников, отдавать участников пакетно одним запросом (или заранее загруженным join), а не поэтапно внутри сборки ответа.
- Добавить/проверить составной индекс под пагинацию и фильтр участника: `conversation_participant(user_id, is_deleted, conversation_id)` и `conversation(last_message_at DESC, id DESC)`.
- Рассмотреть денормализацию `unread_count` в `conversation_participant` (обновление на запись), если SLA требует <200ms на больших inbox.

## Ручка `POST /conversations/direct`
- Проверка существующего direct через пересечение `IN (subquery)` можно заменить на более узкий агрегирующий запрос по `conversation_participant` (две записи в одной conversation), это снизит план/стоимость на больших объёмах.
- Добавить уникальность direct-пары (например, нормализованная пара user_id + unique key), чтобы исключить гонки и дубликаты при одновременном создании.
- Если профиль пользователя уже в кеше — не делать лишних обращений в БД при формировании `peer_display_name`.

## Ручка `GET /conversations/updates`
- Сейчас unread считается отдельным `COUNT(*)` на каждую conversation; объединить в один агрегирующий запрос по всем conversation_id.
- Добавить индекс `conversation(last_message_at)` (если ещё нет) и индекс на `message(conversation_id, created_at)` для ускорения инкрементальных проверок.

## Ручка `GET /conversations/{conversation_id}`
- Небольшая оптимизация: загружать conversation сразу с проверкой участника в одном запросе (join), чтобы убрать лишнюю проверку/итерацию в Python.
- Если `peer_display_name` уже заполнен — дальнейшая оптимизация не требуется (прирост будет небольшой).

## Ручка `DELETE /conversations/{conversation_id}`
- Мягкое удаление участника уже дешёвое; заметного ускорения обычно не требуется.
- Минорный плюс: объединить получение conversation+participant в один запрос для сокращения round-trip.

## Ручка `GET /conversations/{conversation_id}/messages`
- **Высокий приоритет**: при формировании сообщения есть N+1 на `reply_to` (для каждого message отдельный запрос). Нужно preload всех `reply_to_id` пакетом.
- Подгружать attachments через eager loading (joined/selectin load), чтобы избежать ленивых догрузок на каждый message.
- Проверить индекс под пагинацию: `message(conversation_id, is_deleted, created_at DESC, id DESC)`.

## Ручка `POST /conversations/{conversation_id}/messages`
- Обновление `conversation.last_message_*` корректное; latency здесь чаще упирается в WS fanout.
- Для снижения tail latency — отправку WS-уведомлений можно перевести в фон (очередь/таск после commit), если бизнес допускает небольшую асинхронность.

## Ручка `POST /conversations/{conversation_id}/messages/read`
- Запрос к `message` ради sender_id можно оптимизировать: забирать только нужные поля (`id, sender_id`) вместо целой ORM-сущности.
- Прирост обычно небольшой, но полезно на очень частых read receipts.

## Ручка `PATCH /conversations/{conversation_id}/messages/{message_id}`
- По БД операция дешёвая; основная задержка в WS fanout.
- Оптимизация только инфраструктурная (см. блок настройки сервиса).

## Ручка `DELETE /conversations/{conversation_id}/messages/{message_id}`
- Аналогично PATCH: существенных SQL-узких мест нет, больше эффект даст оптимизация транспорта событий.

## Ручка `GET /messages/search`
- Проверить наличие GIN индекса на `message.content_search`; без него latency может резко расти.
- Для cursor-pagination сейчас `next_cursor` фактически не используется — если нужен масштаб, добавить стабильную пагинацию (rank + created_at + id).
- Ограничить expensive `ts_headline` для длинных текстов (например, только для top-N), иначе CPU на БД растёт.

## Ручка `GET /broadcasts`
- Потенциальный N+1 через `_build_conversation_response`; применить те же подходы, что для `GET /conversations`.

## Ручка `POST /broadcasts`
- **Высокий приоритет**: получение студентов по группам сейчас последовательное HTTP-обращение; перейти на параллельные запросы (`asyncio.gather`) + таймаут/ретраи.
- Добавить batch endpoint в `core-client-info` для списка групп за один вызов — это даст наибольший выигрыш.
- Вставку участников делать batch-вставкой, а не большим количеством `db.add(...)` в цикле.

## Ручка `GET /broadcasts/groups`
- Добавить короткий in-memory/redis cache (например, 30–120 сек), чтобы не ходить каждый раз в `core-client-info`.

## Ручка `GET /users/search`
- На `ILIKE 'prefix%'` добавить подходящий индекс (`LOWER(name)`, `LOWER(last_name)` + функциональный поиск), иначе скан таблицы.
- Сделать merge результатов кеша и `core-client-info` с дедупликацией уже есть; дополнительный прирост будет умеренным.

## Ручка `GET /users/{user_id}`
- Оптимизировать почти нечего: уже читает из user cache; прирост минимальный.

## Ручка `POST /files`
- Проверку доступа к сообщению можно сделать одним join-запросом (message + participant), чтобы убрать лишний round-trip.
- Но прирост небольшой, ручка обычно не hot-path.

## Настройка сервиса в целом
- Включить детальный **query profiling** (slow query log + percentile latency по ручкам) и собрать топ N запросов по p95/p99.
- Проверить пул соединений SQLAlchemy/pgbouncer: при недогрузе CPU и высоких latency часто bottleneck в I/O/очереди пула.
- Пересмотреть middleware логирования: синхронный объёмный лог на каждый запрос может добавлять latency на высоком RPS; лучше структурированный async logging.
- Критично для вашего кейса (`GET /conversations ~900ms`): сначала закрыть N+1 в conversations/messages и внешние последовательные HTTP вызовы в broadcasts.
