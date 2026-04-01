# OPTIMISATION — core-messages

## Что уже есть в БД (проверено по SQL)
- Есть индексы: `conversation(last_message_at)`, `conversation_participant(conversation_id)`, `conversation_participant(user_id)`, `message(conversation_id, created_at, id)`, `message(sender_id)`, `GIN(message.content_search)`, `message_attachment(message_id)`.
- Есть связи: `conversation_participant.conversation_id -> conversation.id`, `message.conversation_id -> conversation.id`, `message.reply_to_id -> message.id`, `message_attachment.message_id -> message.id`.
- Есть уникальность: `UNIQUE (conversation_id, user_id)` для участников.
- Не хватает индексов для частых фильтров `is_deleted` и для сортировки `last_message_at + id`.

## GET /conversations
- Узкое место: N+1 в коде на unread и обогащение участников.
- По БД: добавить составной индекс `conversation_participant(user_id, is_deleted, conversation_id)`.
- По БД: добавить индекс `conversation(last_message_at DESC, id DESC)` (текущий только по `last_message_at`).
- По коду: считать unread батчем (1 агрегирующий SQL на страницу), а не по диалогу.

## POST /conversations/direct
- В БД уже есть `UNIQUE (conversation_id, user_id)`, но это не запрещает дубликаты direct-пар в разных conversation.
- Добавить защиту от дублей direct-пары на уровне данных (например, отдельная таблица пар или функциональный уникальный ключ).

## GET /conversations/updates
- Добавить индекс `message(conversation_id, is_deleted, created_at)` (сейчас нет `is_deleted` в индексе).
- Убрать N+1 `COUNT(*)` и заменить на один grouped-query.

## GET /conversations/{conversation_id}
- Схема для этой ручки достаточная; заметный выигрыш только от объединения проверок в один SQL.

## DELETE /conversations/{conversation_id}
- Схема достаточная; это дешёвая операция `is_deleted=true` у participant.

## GET /conversations/{conversation_id}/messages
- Добавить индекс `message(conversation_id, is_deleted, created_at DESC, id DESC)`.
- Для `reply_to_id` добавить индекс `message(reply_to_id)` (сейчас FK есть, индекса нет).
- В коде убрать N+1 на `reply_to`.

## POST /conversations/{conversation_id}/messages
- БД-часть уже быстрая, основной tail — WS fanout.
- Если допустимо, вынести WS publish в фон после commit.

## POST /conversations/{conversation_id}/messages/read
- Индексы достаточные; ручка в основном write-light.

## PATCH /conversations/{conversation_id}/messages/{message_id}
- Индексы достаточные; bottleneck обычно не SQL, а рассылка событий.

## DELETE /conversations/{conversation_id}/messages/{message_id}
- Индексы достаточные; bottleneck обычно не SQL, а рассылка событий.

## GET /messages/search
- GIN по `content_search` уже есть — это правильно.
- Для стабильной пагинации добавить cursor по `(rank, created_at, id)`; сейчас `next_cursor` не используется.

## GET /broadcasts
- Те же N+1 проблемы, что и у `/conversations`.

## POST /broadcasts
- Критичный выигрыш не в БД, а в I/O: параллелить вызовы в `core-client-info`.

## GET /broadcasts/groups
- Добавить short TTL cache (in-memory/redis), чтобы не дергать соседний сервис на каждый запрос.

## GET /users/search
- В `user_cache` нет индексов по `name`, `last_name`, `group_name`.
- Добавить функциональные индексы `LOWER(name)` и `LOWER(last_name)` (или trigram), иначе рост latency на больших объёмах.

## GET /users/{user_id}
- Оптимизировать нечего: PK lookup по `user_cache.user_id`.

## POST /files
- Схема достаточная; небольшой выигрыш даст merge-проверка access в один join-запрос.

## Настройка сервиса в целом
- Главный приоритет: убрать N+1 в conversations/messages и добавить составные индексы с `is_deleted`.
- После этого — тюнинг WS fanout и внешних HTTP вызовов в broadcasts.
