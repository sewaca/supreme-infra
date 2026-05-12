# ERD — Database Schemas

## core-auth-db

```mermaid
erDiagram
    auth_user {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR name
        VARCHAR(20) role
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    two_factor_auth {
        UUID id PK
        UUID user_id FK "unique"
        BOOLEAN is_enabled
        VARCHAR method
        VARCHAR secret
        VARCHAR backup_codes
        TIMESTAMPTZ verified_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    user_session {
        UUID id PK
        UUID user_id FK
        UUID jti UK
        VARCHAR user_agent
        VARCHAR ip_address
        VARCHAR location
        VARCHAR device
        TIMESTAMPTZ created_at
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ revoked_at
    }

    auth_challenge {
        UUID id PK
        UUID user_id FK
        VARCHAR(6) code
        INTEGER attempts
        TIMESTAMPTZ start_at
        TIMESTAMPTZ expiring_at
        TIMESTAMPTZ resolved_at
    }

    caldav_token {
        UUID id PK
        VARCHAR(64) token UK
        UUID user_id FK
        VARCHAR(255) device_name
        TIMESTAMPTZ created_at
        TIMESTAMPTZ revoked_at
    }

    auth_user ||--o| two_factor_auth : "has 2FA"
    auth_user ||--o{ user_session : "has sessions"
    auth_user ||--o{ auth_challenge : "has challenges"
    auth_user ||--o{ caldav_token : "has caldav tokens"
```

### Описание таблиц

**`auth_user`** — единственный источник правды по учётным данным. Все остальные сервисы идентифицируют пользователя по `id` из этой таблицы.

- `role`: `student` | `teacher` | `admin` | `moderator`
- `is_active` — мягкое отключение аккаунта без удаления

**`two_factor_auth`** — конфигурация 2FA (1:1 с пользователем). Запись создаётся при включении 2FA, `is_enabled` может оставаться `false` до верификации.

- `method`: `totp` | `sms` | `email`
- `secret` — TOTP-секрет в формате base32
- `backup_codes` — JSON-массив одноразовых резервных кодов

**`user_session`** — каждая запись соответствует одному выданному JWT-токену. Используется для листинга активных сессий и отзыва токенов.

- `jti` — JWT ID из payload токена; проверяется при валидации сессии
- `revoked_at` — мягкий логаут без удаления записи
- `location` / `device` — вычисляются при логине из IP и User-Agent

**`auth_challenge`** — временный OTP-код для 2FA-флоу.

- `code` — 6-значный код
- `attempts` — счётчик неверных попыток (защита от брутфорса)
- `expiring_at` — TTL кода; `resolved_at` — проставляется при успешном вводе

**`caldav_token`** — долгоживущие токены для подписки на расписание через CalDAV. Передаются в URL, не требуют JWT.

- `token` — случайная строка 64 символа
- `revoked_at` — отзыв без удаления строки

---

## core-applications-db

> `user_id` — логическая ссылка на `core-auth-db.auth_user.id`, FK не объявлен.

```mermaid
erDiagram
    user_application {
        UUID id PK
        UUID user_id
        VARCHAR application_type
        VARCHAR application_number
        JSONB additional_fields
        TIMESTAMPTZ start_date
        TIMESTAMPTZ end_date
        BOOLEAN is_active
        INTEGER notifications_count
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    application_notification {
        UUID id PK
        UUID application_id FK
        VARCHAR severity
        VARCHAR message
        VARCHAR action
        TIMESTAMPTZ created_at
    }

    reference_order {
        UUID id PK
        UUID user_id
        VARCHAR reference_type
        VARCHAR type_label
        VARCHAR status
        TIMESTAMPTZ order_date
        VARCHAR pickup_point_id
        BOOLEAN virtual_only
        TIMESTAMPTZ storage_until
        VARCHAR pdf_url
    }

    order {
        UUID id PK
        UUID user_id
        VARCHAR type
        VARCHAR number
        VARCHAR title
        DATE date
        JSONB additional_fields
        VARCHAR pdf_url
        JSONB actions
        TIMESTAMPTZ created_at
    }

    order_notification {
        UUID id PK
        UUID order_id FK
        VARCHAR severity
        VARCHAR message
        VARCHAR action
        TIMESTAMPTZ created_at
    }

    user_application ||--o{ application_notification : "has notifications"
    order ||--o{ order_notification : "has notifications"
```

### Описание таблиц

**`user_application`** — заявление студента (академический отпуск, перевод, справка и т.д.).

- `application_type` — тип заявления (строковый код)
- `application_number` — номер в системе документооборота
- `additional_fields` (JSONB) — произвольные поля, специфичные для типа заявления
- `notifications_count` — денормализованный счётчик непрочитанных уведомлений

**`application_notification`** — уведомление об изменении статуса заявления.

- `severity`: `info` | `warning` | `error`
- `action` — ссылка или действие, предлагаемое пользователю

**`reference_order`** — заказ официальной справки (об обучении, с места учёбы и т.д.).

- `status`: `preparation` | `ready` | `issued`
- `pickup_point_id` — точка выдачи справки
- `virtual_only` — только электронный вариант без бумажного
- `storage_until` — срок хранения до выдачи; `pdf_url` — ссылка на PDF

**`order`** — приказ деканата, затрагивающий студента (зачисление, отчисление, перевод).

- `additional_fields` (JSONB) — произвольные реквизиты приказа
- `actions` (JSONB) — список доступных действий студента по данному приказу

**`order_notification`** — уведомление о появлении нового приказа или изменении существующего.

---

## core-client-info-db

> Большинство `user_id`-полей не имеют FK-ограничений. `attestation.teacher_id` — единственный FK к `user.id`.
> `academic_debt.conversation_id` — логическая ссылка на `core-messages-db.conversation.id`.

```mermaid
erDiagram
    user {
        UUID id PK
        VARCHAR name
        VARCHAR last_name
        VARCHAR middle_name
        VARCHAR email UK
        VARCHAR avatar
        DATE birth_date
        VARCHAR snils
        DATE snils_issue_date
        VARCHAR region
        INTEGER course
        VARCHAR faculty
        VARCHAR specialty
        VARCHAR direction
        VARCHAR profile
        VARCHAR group
        VARCHAR status
        VARCHAR qualification
        INTEGER start_year
        INTEGER end_year
        VARCHAR student_card_number
        VARCHAR university
        NUMERIC average_grade
        VARCHAR education_form
        BOOLEAN is_registered
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    user_settings {
        UUID id PK
        UUID user_id UK
        BOOLEAN is_new_message_notifications_enabled
        BOOLEAN is_schedule_change_notifications_enabled
        VARCHAR telegram_token
        VARCHAR vk_token
        TIMESTAMPTZ updated_at
    }

    rating_level {
        UUID id PK
        UUID user_id UK
        VARCHAR level
        INTEGER current_xp
        TIMESTAMPTZ updated_at
    }

    ranking_position {
        UUID id PK
        UUID user_id
        VARCHAR ranking_type
        INTEGER position
        INTEGER total
        NUMERIC percentile
        TIMESTAMPTZ updated_at
    }

    user_achievement {
        UUID id PK
        UUID user_id
        VARCHAR achievement_id
        BOOLEAN unlocked
        TIMESTAMPTZ unlocked_at
        INTEGER progress
        INTEGER max_progress
        INTEGER times_earned
        TIMESTAMPTZ updated_at
    }

    streak {
        UUID id PK
        UUID user_id UK
        INTEGER current
        INTEGER best
        TIMESTAMPTZ last_updated
    }

    user_grade {
        UUID id PK
        UUID user_id
        VARCHAR subject
        NUMERIC grade
        VARCHAR grade_type
        TIMESTAMPTZ grade_date
        INTEGER course
        INTEGER semester
        INTEGER hours
        VARCHAR teacher
        UUID teacher_id
        TIMESTAMPTZ created_at
    }

    subject_choice {
        UUID id PK
        VARCHAR choice_id UK
        TIMESTAMPTZ deadline_date
        BOOLEAN is_active
        JSONB subjects
        TIMESTAMPTZ created_at
    }

    user_subject_priority {
        UUID id PK
        UUID user_id
        UUID choice_id FK
        VARCHAR subject_id
        INTEGER priority
        TIMESTAMPTZ created_at
    }

    academic_debt {
        UUID id PK
        UUID user_id
        VARCHAR subject
        VARCHAR grade_type
        INTEGER course
        INTEGER semester
        INTEGER hours
        UUID teacher_id
        VARCHAR teacher_name
        VARCHAR status
        TIMESTAMPTZ retake_date
        VARCHAR retake_classroom
        UUID conversation_id
        TIMESTAMPTZ requested_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    attestation {
        UUID id PK
        UUID user_id
        VARCHAR subject_name
        BOOLEAN is_attested
        TEXT reason
        UUID teacher_id FK
        INTEGER semester
        TIMESTAMPTZ created_at
    }

    user ||--o| user_settings : "has settings"
    user ||--o| rating_level : "has rating"
    user ||--o{ ranking_position : "has rankings"
    user ||--o{ user_achievement : "has achievements"
    user ||--o| streak : "has streak"
    user ||--o{ user_grade : "has grades"
    user ||--o{ academic_debt : "has debts"
    user ||--o{ attestation : "attested by"
    subject_choice ||--o{ user_subject_priority : "has priorities"
    user ||--o{ attestation : "is teacher in"
```

### Описание таблиц

**`user`** — профиль студента или преподавателя. Хранит личные и учебные данные.

- Личные: `snils`, `birth_date`, `region`, `avatar`
- Учебные: `course`, `faculty`, `specialty`, `direction`, `profile`, `group`, `qualification`, `education_form`
- `status` — текущий статус (`Обучается (Бюджет)`, `Преподаватель` и т.д.)
- `is_registered` — `false` если пользователь ещё не создал аккаунт в `core-auth`; используется в регистрационном флоу по СНИЛС

**`user_settings`** — настройки уведомлений (1:1 с `user`).

- `telegram_token` / `vk_token` — токены для push-уведомлений через мессенджеры

**`rating_level`** — уровень геймификации пользователя (1:1).

- `level`: `beginner` | `intermediate` | `advanced` | ...
- `current_xp` — текущий опыт внутри уровня

**`ranking_position`** — позиция в рейтинге по разным срезам. Одна строка на каждую комбинацию `(user, ranking_type)`.

- `ranking_type`: `byGrade`, `byAttendanceCourse`, `byAttendanceFaculty`, `byAttendanceUniversity` и т.д.
- `percentile` — процентиль (топ-X%)

**`user_achievement`** — прогресс по достижениям.

- `achievement_id` — строковый идентификатор ачивки
- `progress` / `max_progress` — прогресс до разблокировки
- `times_earned` — счётчик для повторяемых ачивок

**`streak`** — серия активностей (1:1 с пользователем).

- `current` — текущая непрерывная серия; `best` — лучшая за всё время

**`user_grade`** — оценка студента за предмет.

- `grade_type`: `exam` | `credit` | `differential_credit`
- `teacher` — ФИО преподавателя (денормализованная строка, заполняется всегда)
- `teacher_id` — UUID преподавателя (добавлен в migration 008, может быть `NULL` для старых записей)

**`subject_choice`** — сессия выбора дисциплин по выбору.

- `subjects` (JSONB) — список доступных предметов
- `deadline_date` — срок подачи приоритетов; `is_active` — открыта ли запись

**`user_subject_priority`** — предпочтения студента в рамках конкретной сессии выбора.

- `priority` — порядковый номер предпочтения (1 = первый выбор)

**`academic_debt`** — академическая задолженность студента.

- `status`: `pending` → `requested` → `scheduled` → `resolved`
- `conversation_id` — ссылка на чат с преподавателем в `core-messages-db`; создаётся при переходе в `requested`
- `teacher_name` — денормализованное ФИО (на случай если `teacher_id` изменится)

**`attestation`** — промежуточная аттестация студента по предмету за семестр.

- `is_attested` — прошёл / не прошёл
- `reason` — обязателен при `is_attested = false` (CHECK-constraint в БД)
- `teacher_id` — единственный FK в этой БД, ссылается на `user.id`

---

## core-messages-db

> `user_cache` удалена в migration 007 — заменена Redis-кешем.
> `owner_id`, `user_id`, `sender_id` — логические ссылки на `core-auth-db.auth_user.id`.

```mermaid
erDiagram
    conversation {
        UUID id PK
        VARCHAR(20) type
        VARCHAR(500) title
        UUID owner_id
        TIMESTAMPTZ last_message_at
        VARCHAR(200) last_message_preview
        UUID last_message_sender_id
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    conversation_participant {
        UUID id PK
        UUID conversation_id FK
        UUID user_id
        VARCHAR(20) role
        BOOLEAN can_reply
        UUID last_read_message_id
        TIMESTAMPTZ last_read_at
        BOOLEAN is_deleted
        TIMESTAMPTZ joined_at
        VARCHAR(500) peer_display_name
    }

    message {
        UUID id PK
        UUID conversation_id FK
        UUID sender_id
        TEXT content
        VARCHAR(20) content_type
        TSVECTOR content_search
        UUID reply_to_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        BOOLEAN is_deleted
    }

    message_attachment {
        UUID id PK
        UUID message_id FK
        VARCHAR(1000) file_url
        VARCHAR(500) file_name
        INTEGER file_size
        VARCHAR(100) mime_type
        VARCHAR(1000) thumbnail_url
        TIMESTAMPTZ created_at
    }

    conversation ||--o{ conversation_participant : "has participants"
    conversation ||--o{ message : "has messages"
    message ||--o{ message_attachment : "has attachments"
    message ||--o| message : "reply_to"
```

### Описание таблиц

**`conversation`** — диалог или групповой чат.

- `type`: `direct` | `group` | `channel`
- `last_message_at` / `last_message_preview` / `last_message_sender_id` — денормализованные поля для быстрого рендера списка чатов без JOIN

**`conversation_participant`** — участник чата. Одна запись на каждую пару `(conversation, user)`.

- `role`: `member` | `admin`
- `can_reply` — в каналах может быть `false` (режим read-only)
- `last_read_message_id` / `last_read_at` — для подсчёта непрочитанных
- `is_deleted` — мягкое удаление (пользователь покинул чат)
- `peer_display_name` — кешированное имя собеседника в личных чатах

**`message`** — сообщение в чате.

- `content_type`: `text` | `image` | ...
- `content_search` (TSVECTOR) — заполняется триггером `messages_search_trigger` автоматически, используется для full-text поиска на русском языке
- `reply_to_id` — ссылка на цитируемое сообщение (self-join, `ON DELETE SET NULL`)
- `is_deleted` — мягкое удаление сообщения

**`message_attachment`** — вложение к сообщению.

- `mime_type` — определяет тип превью на клиенте
- `thumbnail_url` — уменьшенная версия для изображений и видео

---

## core-news-db

Автономная БД, внешних связей нет.

```mermaid
erDiagram
    news {
        UUID id PK
        TEXT title
        TEXT url UK
        TEXT date
        TEXT category
        TIMESTAMPTZ created_at
    }
```

### Описание таблиц

**`news`** — новость университета, агрегированная с внешнего сайта.

- `url` — уникален, защищает от дублей при повторном парсинге (`ON CONFLICT DO NOTHING`)
- `date` — строка в оригинальном формате источника (не `DATE`, так как формат нестабилен)
- `category` — рубрика (`Образование`, `Наука`, `Индустрия`, `Международное` и т.д.)

---

## core-schedule-db

> `teacher_id` в `schedule_template`/`schedule_override`/`session_event` — логическая ссылка на `core-client-info-db.user.id`. `teacher_cache.id` зеркалит те же UUID.

```mermaid
erDiagram
    teacher_cache {
        UUID id PK
        VARCHAR name
        TIMESTAMPTZ updated_at
    }

    classroom {
        UUID id PK
        VARCHAR name UK
        VARCHAR building
        INTEGER capacity
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    semester {
        UUID id PK
        VARCHAR name
        DATE start_date
        DATE end_date
        DATE cycle_anchor_date
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    schedule_template {
        UUID id PK
        UUID semester_id FK
        SMALLINT week_number
        SMALLINT day_of_week
        SMALLINT slot_number
        TIME start_time
        TIME end_time
        VARCHAR subject_name
        VARCHAR lesson_type
        UUID teacher_id
        VARCHAR group_name
        VARCHAR classroom_name
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    schedule_override {
        UUID id PK
        UUID semester_id FK
        DATE date
        SMALLINT slot_number
        VARCHAR group_name
        VARCHAR action
        VARCHAR new_subject_name
        VARCHAR new_lesson_type
        UUID new_teacher_id
        VARCHAR new_classroom_name
        TIME new_start_time
        TIME new_end_time
        VARCHAR comment
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    session_event {
        UUID id PK
        UUID semester_id FK
        DATE date
        SMALLINT slot_number
        TIME start_time
        TIME end_time
        VARCHAR subject_name
        VARCHAR lesson_type
        UUID teacher_id
        VARCHAR group_name
        VARCHAR classroom_name
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    semester ||--o{ schedule_template : "has template slots"
    semester ||--o{ schedule_override : "has overrides"
    semester ||--o{ session_event : "has session events"
    teacher_cache ||--o{ schedule_template : "teaches (cache)"
    teacher_cache ||--o{ session_event : "teaches (cache)"
```

### Описание таблиц

**`teacher_cache`** — локальная копия имён преподавателей из `core-client-info-db`. UUID совпадает с `user.id`. Обновляется при изменении профиля преподавателя, чтобы сервис расписания не делал cross-service запросы при каждом рендере.

**`classroom`** — аудитория.

- `building` — корпус; `capacity` — вместимость

**`semester`** — учебный семестр.

- `cycle_anchor_date` — дата начала отсчёта двухнедельного цикла; используется для вычисления номера недели по конкретной дате
- `is_active` — в каждый момент активен ровно один семестр

**`schedule_template`** — одна пара в двухнедельном шаблоне расписания. Фактическое расписание на конкретную дату строится из шаблона с учётом `schedule_override`.

- `week_number`: `1` | `2` — номер недели в двухнедельном цикле
- `day_of_week`: `0`–`5` — пн–сб
- `slot_number`: `1`–`8` — номер пары
- Уникальность: `(semester_id, week_number, day_of_week, slot_number, group_name)`

**`schedule_override`** — исключение из шаблона на конкретную дату (отмена, перенос, замена преподавателя).

- `action`: `cancel` | `replace` | `add`
- Поля `new_*` заполняются только при `replace` / `add`; при `cancel` — NULL

**`session_event`** — событие сессии (экзамен, зачёт, консультация). Не привязано к шаблону, хранится отдельно от обычного расписания.

---

## Связи между БД

Все межсервисные ссылки — логические (UUID без FK), целостность обеспечивается на уровне приложений.

```mermaid
erDiagram
    AUTH_USER["core-auth-db · auth_user"] {
        UUID id PK
        VARCHAR email UK
    }

    CLIENT_USER["core-client-info-db · user"] {
        UUID id PK
        VARCHAR email UK
        BOOLEAN is_registered
    }

    APP_USER_APPLICATION["core-applications-db · user_application"] {
        UUID user_id
    }
    APP_REFERENCE_ORDER["core-applications-db · reference_order"] {
        UUID user_id
    }
    APP_ORDER["core-applications-db · order"] {
        UUID user_id
    }

    MSG_CONVERSATION["core-messages-db · conversation"] {
        UUID owner_id
        UUID last_message_sender_id
    }
    MSG_PARTICIPANT["core-messages-db · conversation_participant"] {
        UUID user_id
    }
    MSG_MESSAGE["core-messages-db · message"] {
        UUID sender_id
    }

    SCH_TEACHER_CACHE["core-schedule-db · teacher_cache"] {
        UUID id PK
    }
    SCH_TEMPLATE["core-schedule-db · schedule_template"] {
        UUID teacher_id
    }
    SCH_SESSION["core-schedule-db · session_event"] {
        UUID teacher_id
    }

    CLIENT_DEBT["core-client-info-db · academic_debt"] {
        UUID user_id
        UUID teacher_id
        UUID conversation_id
    }

    AUTH_USER ||--|| CLIENT_USER : "email (logical)"

    AUTH_USER ||--o{ APP_USER_APPLICATION : "user_id (logical)"
    AUTH_USER ||--o{ APP_REFERENCE_ORDER : "user_id (logical)"
    AUTH_USER ||--o{ APP_ORDER : "user_id (logical)"

    AUTH_USER ||--o{ MSG_CONVERSATION : "owner_id (logical)"
    AUTH_USER ||--o{ MSG_PARTICIPANT : "user_id (logical)"
    AUTH_USER ||--o{ MSG_MESSAGE : "sender_id (logical)"

    CLIENT_USER ||--o| SCH_TEACHER_CACHE : "id mirrors (sync)"
    CLIENT_USER ||--o{ SCH_TEMPLATE : "teacher_id (logical)"
    CLIENT_USER ||--o{ SCH_SESSION : "teacher_id (logical)"

    CLIENT_USER ||--o{ CLIENT_DEBT : "user_id (logical)"
    CLIENT_USER ||--o{ CLIENT_DEBT : "teacher_id (logical)"

    MSG_CONVERSATION ||--o| CLIENT_DEBT : "conversation_id (logical)"
```

### Таблица межсервисных зависимостей

| Откуда                                      | Поле              | Куда                            | Тип связи          |
| ------------------------------------------- | ----------------- | ------------------------------- | ------------------ |
| `core-auth-db.auth_user`                    | `email`           | `core-client-info-db.user`      | логическая, 1:1    |
| `core-applications-db.user_application`     | `user_id`         | `core-auth-db.auth_user`        | логическая, N:1    |
| `core-applications-db.reference_order`      | `user_id`         | `core-auth-db.auth_user`        | логическая, N:1    |
| `core-applications-db.order`                | `user_id`         | `core-auth-db.auth_user`        | логическая, N:1    |
| `core-messages-db.conversation`             | `owner_id`        | `core-auth-db.auth_user`        | логическая, N:1    |
| `core-messages-db.conversation_participant` | `user_id`         | `core-auth-db.auth_user`        | логическая, N:1    |
| `core-messages-db.message`                  | `sender_id`       | `core-auth-db.auth_user`        | логическая, N:1    |
| `core-schedule-db.teacher_cache`            | `id`              | `core-client-info-db.user`      | синхронизация, 1:1 |
| `core-schedule-db.schedule_template`        | `teacher_id`      | `core-client-info-db.user`      | логическая, N:1    |
| `core-schedule-db.session_event`            | `teacher_id`      | `core-client-info-db.user`      | логическая, N:1    |
| `core-client-info-db.academic_debt`         | `teacher_id`      | `core-client-info-db.user`      | логическая, N:1    |
| `core-client-info-db.academic_debt`         | `conversation_id` | `core-messages-db.conversation` | логическая, N:1    |
