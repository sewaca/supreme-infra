# OPTIMISATION — core-client-info

## Что уже есть в БД (проверено по SQL)

- Есть: `user(email)` unique+index, `user_grade(user_id)`, `user_grade(grade_date)`, `user_subject_priority(user_id)`.
- Есть уникальности: `ranking_position(user_id, ranking_type)`, `user_achievement(user_id, achievement_id)`, `user_subject_priority(user_id, choice_id, subject_id)`.
- Проблема: для большинства read-ручек индексы по рабочим полям отсутствуют (`group`, ranking filters, achievement filters, settings.user_id и т.д.).

## GET /profile/user

- PK lookup по `user.id` быстрый; оптимизация минимальна.

## GET /profile/personal-data

- PK lookup по `user.id` быстрый; оптимизация минимальна.

## GET /settings / PUT /settings

- В `user_settings` есть `UNIQUE(user_id)` (индекс создаётся автоматически), для этой ручки этого достаточно.

## POST /settings/email

- `user.email` unique+index уже есть, БД-часть корректная.

## POST /settings/password

- SQL-нагрузка небольшая; bottleneck обычно внешний вызов в auth.

## GET /rating/stats / GET /rating/level / GET /rating/streak

- В таблицах `rating_level` и `streak` есть `UNIQUE(user_id)` (индекс), для user-specific read достаточно.

## GET /rating/rankings

- Сейчас есть только уникальный индекс `(user_id, ranking_type)`.
- Для leaderboard добавить индекс по `(ranking_type, position)` или `(ranking_type, percentile DESC)` в зависимости от запроса.

## GET /rating/achievements

- Для выборки всех ачивок пользователя уникальный `(user_id, achievement_id)` уже помогает.
- Если часто фильтруется по `unlocked`, добавить `(user_id, unlocked)`.

## GET /rating/grades / GET /rating/grade-improvements

- Есть отдельные индексы по `user_id` и `grade_date`.
- Для типового запроса «оценки пользователя по дате» лучше добавить составной `(user_id, grade_date DESC)`.

## GET /subjects/choices

- Сейчас нет индекса по `subject_choice.is_active`/`deadline_date`.
- Добавить `(is_active, deadline_date)`.

## GET /subjects/user-priorities/{choice_id}

- Сейчас индекс только по `user_id`.
- Добавить составной `(user_id, choice_id)`.

## POST /subjects/save-priorities

- Для upsert уникальность `(user_id, choice_id, subject_id)` уже есть — это корректно.

## POST /profile/users/batch

- PK lookup по `user.id` быстрый.
- Критично ограничить выбираемые поля (не тянуть тяжёлые JSON/лишние колонки).

## GET /profile/groups

- Поле `user.group` без индекса; для DISTINCT/group list нужен индекс по `("group")`.

## GET /profile/users-by-group

- Сейчас по `group` индекса нет — это главный пропуск для этого endpoint.
- Добавить индекс `user("group")`.

## GET /status

- Оптимизировать нечего.

## Настройка сервиса в целом

- Основные недостающие индексы: `user("group")`, `user_grade(user_id, grade_date DESC)`, `ranking_position(ranking_type, position)`, `subject_choice(is_active, deadline_date)`, `user_subject_priority(user_id, choice_id)`.
- Это напрямую ускорит API, которые активно дергает `core-messages`.
