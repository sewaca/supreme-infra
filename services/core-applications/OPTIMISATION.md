# OPTIMISATION — core-applications

## Ручка `GET /status`
- Оптимизировать нечего.

## Ручка `GET /applications`
- Проверить индексы по основным фильтрам/сортировкам (обычно user_id, created_at, status).
- Избегать N+1 при подгрузке связанных сущностей.

## Ручка `GET /applications/notifications`
- Если есть непрочитанные/последние события — индекс по `(user_id, created_at DESC)`.
- Короткий cache допустим, если не требуется строгая консистентность.

## Ручка `GET /references`
- Нужны индексы под фильтры списка и пагинацию.
- Ограничить payload (короткий DTO для list).

## Ручка `GET /references/{reference_id}`
- Обычно single-row fetch; оптимизация минимальна.

## Ручка `POST /references/order`
- Write endpoint; проверить, что валидация/внешние вызовы не блокируют транзакцию.

## Ручка `POST /references/{reference_id}/cancel`
- Если есть проверки статусов, можно сделать атомарным `UPDATE ... WHERE status=...`.

## Ручка `POST /references/{reference_id}/extend-storage`
- Аналогично cancel: атомарный update + индекс по `reference_id`.

## Ручка `GET /references/{reference_id}/pdf`
- Если PDF генерируется на лету, вынести генерацию в async job и кешировать результат.
- Если PDF хранится в объектном хранилище — отдавать pre-signed URL.

## Ручка `GET /orders`
- Индексы по фильтрам/сортировке обязательны.
- Для больших списков: keyset pagination вместо offset.

## Ручка `GET /orders/counts`
- Частые `COUNT(*)` по большим таблицам лучше обслуживать через pre-aggregated counters.

## Ручка `GET /orders/{order_id}`
- Оптимизация минимальна (single-row).

## Ручка `GET /orders/{order_id}/pdf`
- Те же рекомендации, что для `/references/{reference_id}/pdf`.

## Ручка `POST /dormitory/parent-agreement`
- Проверить размер payload/файлов и вынос тяжёлой обработки в фон.

## Ручка `POST /dormitory/applications`
- Для массовых вложенных записей использовать batch insert/upsert.

## Настройка сервиса в целом
- Основной фокус: списковые ручки и PDF-поток.
- Включить профилирование SQL, отдельно измерить генерацию/доставку PDF.
- Проверить pgbouncer/connection pool и лимиты воркеров ASGI.
