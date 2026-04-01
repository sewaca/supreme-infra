# OPTIMISATION — core-applications

## Что уже есть в БД (проверено по SQL)
- Есть индексы: `user_application(user_id)`, `user_application(application_type)`, `application_notification(application_id)`, `reference_order(user_id)`, `order(user_id)`, `order(type)`, `order_notification(order_id)`.
- Внешние ключи для notification таблиц настроены (`ON DELETE CASCADE`).
- Не хватает индексов по датам/статусам для списков и сортировок.

## GET /applications
- Базовый фильтр по `user_id` покрыт индексом.
- Если есть сортировка по дате/активности, добавить `(user_id, created_at DESC)` и/или `(user_id, is_active)`.

## GET /applications/notifications
- Есть индекс только по `application_id`.
- Для выдачи «последние уведомления пользователя» нужен индекс по `created_at` или материализация через join-таблицу с user_id.

## GET /references
- Индекс `reference_order(user_id)` есть.
- Для типовых фильтров по статусу и дате добавить `(user_id, status, order_date DESC)`.

## GET /references/{reference_id}
- PK lookup быстрый.

## POST /references/order
- Insert путь оптимальный.

## POST /references/{reference_id}/cancel
- PK update быстрый.

## POST /references/{reference_id}/extend-storage
- PK update быстрый.

## GET /references/{reference_id}/pdf
- БД-узких мест нет (точечная выборка).

## GET /orders
- Есть индексы `user_id` и `type`, но нет комбинированного для списка с сортировкой.
- Добавить `(user_id, date DESC)`; если фильтруют по типу, добавить `(user_id, type, date DESC)`.

## GET /orders/counts
- Для COUNT по типам лучше использовать агрегат по индексируемым полям (`user_id`, `type`).
- При высоких объёмах можно ввести pre-aggregated counters.

## GET /orders/{order_id}
- PK lookup быстрый.

## GET /orders/{order_id}/pdf
- БД-узких мест нет.

## POST /dormitory/parent-agreement
- Вероятный bottleneck не SQL, а обработка файла/внешний storage.

## POST /dormitory/applications
- Для массовых insert лучше batch-вставки (если endpoint принимает набор данных).

## GET /status
- Оптимизировать нечего.

## Настройка сервиса в целом
- Схема базово корректная, но read-ручкам не хватает составных индексов по `(user_id, status/date/created_at)`.
