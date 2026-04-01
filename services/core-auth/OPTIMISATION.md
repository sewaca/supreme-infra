# OPTIMISATION — core-auth

## Ручка `GET /status`
- Оптимизировать нечего: служебный health-check.

## Ручка `POST /auth/login`
- Добавить индекс/уникальность на `auth_user.email` (если ещё нет).
- Вынести внешнее geo lookup (`ipwho.is`) в фон или за фича-флаг: это I/O, который может добавлять хвост latency.
- Снизить объём debug-логов с чувствительными полями, особенно при высоком RPS.

## Ручка `POST /auth/register`
- Бизнес-логика уже простая; ускорение в основном через уменьшение стоимости bcrypt (только если это допустимо по security-политике).
- Для массовой регистрации можно добавить отложенную синхронизацию профиля в `core-client-info` (сейчас TODO).

## Ручка `GET /auth/me`
- Оптимизировать нечего, тяжёлых операций нет.

## Ручка `GET /auth/sessions`
- Сейчас 2 запроса (auth sessions + caldav tokens) и merge в Python — это ок.
- Для роста данных добавить индекс `user_session(user_id, revoked_at, expires_at, created_at)`.

## Ручка `DELETE /auth/sessions/{session_id}`
- Проверка двух сущностей по очереди нормальна; можно ускорить объединением в один SQL/CTE, но прирост небольшой.

## Ручка `POST /auth/validate-session`
- Добавить индекс на `user_session.jti` (критично для частой валидации токенов).
- Можно локально кешировать результат проверки revoked для короткого TTL (10–30с), если допустимо по security.

## Ручка `GET /auth/caldav-tokens`
- Добавить индекс `caldav_token(user_id, revoked_at, created_at)`.
- В остальном оптимизировать почти нечего.

## Ручка `POST /auth/caldav-tokens`
- Запись лёгкая, существенных проблем не ожидается.

## Ручка `DELETE /auth/caldav-tokens/{token_id}`
- Добавить индекс по `id`/`user_id` (обычно уже PK + secondary), иначе на росте данных latency увеличится.

## Ручка `POST /auth/challenge`
- Сервис в основном write-bound; оптимизировать почти нечего.
- Если появятся пики — добавить rate limit на пользователя.

## Ручка `POST /auth/challenge/{challenge_id}/verify`
- Добавить индекс `(id, user_id)` для challenge lookup.
- Можно сделать атомарный update с проверками, чтобы снизить гонки при конкурентных verify.

## Ручка `GET /auth/challenge/{challenge_id}/check`
- Лёгкая операция; оптимизация минимальна.

## Ручка `POST /auth/forgot-password`
- Потенциально дорогая часть — анти-абьюз/рассылки (когда будут подключены).
- Добавить rate limiting и cooldown per email/IP.

## Ручка `POST /auth/forgot-password/{challenge_id}/verify`
- Аналогично verify challenge: индекс + атомарность попыток.

## Ручка `POST /auth/forgot-password/{challenge_id}/reset`
- Основная стоимость в bcrypt + массовый revoke сессий.
- Нужен индекс на `user_session(user_id, revoked_at)` для быстрого revoke.

## Ручка `PATCH /auth/internal/users/{user_id}/email`
- Проверка уникальности email + update уже оптимальны; прирост небольшой.

## Ручка `PATCH /auth/internal/users/{user_id}/password`
- Аналогично reset: индекс по user_session для revoke.

## Ручка `GET /auth/internal/caldav-tokens/validate/{token}`
- Критично добавить/проверить индекс на `caldav_token(token, revoked_at)`.

## Настройка сервиса в целом
- Поднять наблюдаемость на bcrypt/time-to-first-byte: p95 легко растёт при CPU contention.
- Для security и скорости: ограничить brute-force (rate limits, progressive delays).
- Проверить pool sizing PostgreSQL/pgbouncer и убедиться, что нет ожидания коннекта.
