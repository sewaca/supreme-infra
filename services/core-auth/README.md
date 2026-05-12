# core-auth

Единственный источник правды по аутентификации. Выдаёт JWT-токены, управляет сессиями, реализует 2FA и восстановление пароля.

**Стек:** FastAPI · SQLAlchemy (async) · PostgreSQL · Redis · SMTP  
**Порт:** `8002`  
**БД:** `core_auth_db` → PgBouncer `pgbouncer-core-auth`

---

## Доменная область

- Регистрация и вход по `email` + `password`
- Выдача JWT-токенов и отзыв по `jti`
- Листинг и отзыв активных сессий
- 2FA: challenge/verify флоу (TOTP / SMS / email)
- Восстановление пароля через OTP на email
- CalDAV-токены для подписки на расписание

Сервис **не хранит профиль** — только учётные данные (`email`, `password_hash`, `role`). Профильные данные живут в `core-client-info`.

---

## Зависимости

### Исходящие вызовы

| Сервис              | Когда                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| `core-client-info`  | `POST /auth/lookup` — поиск по СНИЛС; `POST /auth/register` — инициализация профиля |
| `core-applications` | `POST /auth/register` — инициализация заявлений нового пользователя                 |

### Инфраструктура

| Ресурс                    | Назначение                                |
| ------------------------- | ----------------------------------------- |
| PostgreSQL `core_auth_db` | Пользователи, сессии, 2FA, CalDAV-токены  |
| Redis `redis-auth-cache`  | Кеш валидации сессий, защита от брутфорса |
| SMTP (Yandex)             | OTP-коды для 2FA и восстановления пароля  |

### Переменные окружения

| Переменная                                                    | Описание                           |
| ------------------------------------------------------------- | ---------------------------------- |
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD`             | Реквизиты БД                       |
| `REDIS_AUTH_CACHE_URL`                                        | URL Redis                          |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | SMTP для писем                     |
| `MAIL_FROM` / `MAIL_FROM_NAME`                                | Отправитель писем                  |
| `APP_BASE_URL`                                                | Базовый URL (для ссылок в письмах) |

---

## API роуты

Все роуты доступны через gateway с префиксом `/core-auth`.

### Аутентификация

| Метод  | Путь             | Описание                                                                |
| ------ | ---------------- | ----------------------------------------------------------------------- |
| `POST` | `/auth/login`    | Вход по email + пароль. Возвращает `access_token` и данные пользователя |
| `POST` | `/auth/lookup`   | Поиск пользователя по СНИЛС для регистрационного флоу                   |
| `POST` | `/auth/register` | Регистрация: создаёт `auth_user`, вызывает инициализацию профиля        |
| `GET`  | `/auth/me`       | Данные текущего аутентифицированного пользователя                       |

### Сессии

| Метод    | Путь                          | Описание                                                           |
| -------- | ----------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/auth/sessions`              | Список активных сессий (устройств) текущего пользователя           |
| `DELETE` | `/auth/sessions/{session_id}` | Отозвать сессию (выход с конкретного устройства)                   |
| `POST`   | `/auth/validate-session`      | Проверить валидность JWT по `jti` — используется другими сервисами |

### 2FA

| Метод  | Путь                                    | Описание                                   |
| ------ | --------------------------------------- | ------------------------------------------ |
| `POST` | `/auth/challenge`                       | Инициировать 2FA-вызов, отправить OTP-код  |
| `POST` | `/auth/challenge/{challenge_id}/verify` | Проверить введённый OTP                    |
| `GET`  | `/auth/challenge/{challenge_id}/check`  | Проверить статус challenge (решён / истёк) |

### Восстановление пароля

| Метод  | Путь                                          | Описание                            |
| ------ | --------------------------------------------- | ----------------------------------- |
| `POST` | `/auth/forgot-password`                       | Начать флоу: отправить OTP на email |
| `POST` | `/auth/forgot-password/{challenge_id}/verify` | Подтвердить OTP                     |
| `POST` | `/auth/forgot-password/{challenge_id}/reset`  | Установить новый пароль             |

### CalDAV-токены

| Метод    | Путь                             | Описание                                              |
| -------- | -------------------------------- | ----------------------------------------------------- |
| `POST`   | `/auth/caldav-tokens`            | Создать токен для подписки на расписание через CalDAV |
| `GET`    | `/auth/caldav-tokens`            | Список CalDAV-токенов пользователя                    |
| `DELETE` | `/auth/caldav-tokens/{token_id}` | Отозвать токен                                        |

### Внутренние (межсервисные, без публичного доступа)

| Метод   | Путь                                   | Описание                                             |
| ------- | -------------------------------------- | ---------------------------------------------------- |
| `PATCH` | `/auth/users/{user_id}/email`          | Обновить email (вызов из `core-client-info`)         |
| `PATCH` | `/auth/users/{user_id}/password`       | Обновить пароль (вызов из `core-client-info`)        |
| `GET`   | `/auth/caldav-tokens/validate/{token}` | Валидировать CalDAV-токен (вызов из `core-schedule`) |

### Служебные

| Метод | Путь      | Описание     |
| ----- | --------- | ------------ |
| `GET` | `/status` | Health check |

---

## Разработка

```bash
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload --port 8002
```

Swagger UI: http://localhost:8002/core-auth/docs

### Миграции (Alembic)

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

## Тестовые пользователи

| Email                     | Пароль                    | Роль      |
| ------------------------- | ------------------------- | --------- |
| `ivan.ivanov@example.com` | `ivan.ivanov@example.com` | student   |
| `admin@example.com`       | `admin@example.com`       | admin     |
| `moder@example.com`       | `moder@example.com`       | moderator |
| `user@example.com`        | `user@example.com`        | student   |

## Метрики

Prometheus на порту `9464` по пути `/metrics`.
