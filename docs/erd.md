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
        UUID user_id FK UK
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

---

## Связи между БД

Все межсервисные ссылки — логические (UUID без FK), целостность обеспечивается на уровне приложений.

```mermaid
erDiagram
    AUTH_USER["core-auth-db\nauth_user"] {
        UUID id PK
        VARCHAR email UK
    }

    CLIENT_USER["core-client-info-db\nuser"] {
        UUID id PK
        VARCHAR email UK
        BOOLEAN is_registered
    }

    APP_USER_APPLICATION["core-applications-db\nuser_application"] {
        UUID user_id
    }
    APP_REFERENCE_ORDER["core-applications-db\nreference_order"] {
        UUID user_id
    }
    APP_ORDER["core-applications-db\norder"] {
        UUID user_id
    }

    MSG_CONVERSATION["core-messages-db\nconversation"] {
        UUID owner_id
        UUID last_message_sender_id
    }
    MSG_PARTICIPANT["core-messages-db\nconversation_participant"] {
        UUID user_id
    }
    MSG_MESSAGE["core-messages-db\nmessage"] {
        UUID sender_id
    }

    SCH_TEACHER_CACHE["core-schedule-db\nteacher_cache"] {
        UUID id PK
    }
    SCH_TEMPLATE["core-schedule-db\nschedule_template"] {
        UUID teacher_id
    }
    SCH_SESSION["core-schedule-db\nsession_event"] {
        UUID teacher_id
    }

    CLIENT_DEBT["core-client-info-db\nacademic_debt"] {
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
