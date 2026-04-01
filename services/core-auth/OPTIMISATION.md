# OPTIMISATION — core-auth

## Что уже есть в БД (проверено по SQL)

- `auth_user.email` — `UNIQUE` + индекс.
- `user_session.jti` — `UNIQUE` + индекс, `user_session.user_id` — индекс.
- `auth_challenge.user_id`, `auth_challenge.expiring_at` — индексы.
- `caldav_token.token` — `UNIQUE` + partial index `token WHERE revoked_at IS NULL`, `caldav_token.user_id` — индекс.
- Связи настроены корректно: `ON DELETE CASCADE` для зависимых сущностей.

## POST /auth/login

- Индекс по email уже есть, БД часть ок.
- Основная latency: bcrypt + внешняя geo lookup. Geo lookup лучше делать async/опционально.

## POST /auth/register

- БД часть ок (email unique + insert).
- Узкое место только bcrypt.

## GET /auth/me

- Оптимизировать нечего (без SQL).

## GET /auth/sessions

- Нужен дополнительный составной индекс для активных сессий: `user_session(user_id, revoked_at, expires_at, created_at DESC)`.
- Сейчас есть только `user_id`, поэтому фильтрация по revoked/expires может деградировать.

## DELETE /auth/sessions/{session_id}

- PK/индексы достаточные.

## POST /auth/validate-session

- Индекс `jti` уже есть — это правильно.

## GET /auth/caldav-tokens

- Индекс по `user_id` есть, но для сортировки/фильтра активных лучше добавить `(user_id, revoked_at, created_at DESC)`.

## POST /auth/caldav-tokens

- Схема ок.

## DELETE /auth/caldav-tokens/{token_id}

- Схема ок.

## POST /auth/challenge

- Схема ок.

## POST /auth/challenge/{challenge_id}/verify

- PK по `id` уже покрывает поиск challenge.
- Если endpoint станет hot-path, добавить `(id, user_id)` не обязательно, но может снизить cost при сложных планах.

## GET /auth/challenge/{challenge_id}/check

- Схема ок.

## POST /auth/forgot-password

- Схема ок; нужен rate-limit на уровне приложения/API gateway.

## POST /auth/forgot-password/{challenge_id}/verify

- Схема ок.

## POST /auth/forgot-password/{challenge_id}/reset

- Для массового revoke полезен тот же составной индекс по `user_session(user_id, revoked_at, expires_at)`.

## PATCH /auth/internal/users/{user_id}/email

- Схема ок.

## PATCH /auth/internal/users/{user_id}/password

- Для revoke сессий — тот же составной индекс по user_session.

## GET /auth/internal/caldav-tokens/validate/{token}

- Partial index `token WHERE revoked_at IS NULL` уже есть — оптимально для этой ручки.

## GET /status

- Оптимизировать нечего.

## Настройка сервиса в целом

- База в целом настроена хорошо; главный недостающий элемент — составные индексы для «активных сессий».
- По latency основной вклад дают bcrypt и внешние вызовы, не SQL.
