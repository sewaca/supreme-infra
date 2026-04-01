# OPTIMISATION — core-recipes-bff

## Ручка `GET /recipes`
- Для поиска по названию/ингредиентам нужны индексы и, при текстовом поиске, FTS/trigram.
- На больших объёмах перейти с offset на keyset pagination.

## Ручка `GET /recipes/:id`
- Сейчас ответ собирается через несколько последовательных вызовов (recipe + likes count + comments + isLiked).
- **Высокий приоритет**: распараллелить независимые чтения (`Promise.all`), это может заметно снизить latency.

## Ручка `PUT /recipes/:id`
- Для published-варианта после update снова читаются likes/comments; можно возвращать облегчённый ответ или выполнять enrichment опционально.
- Для тяжёлых полей JSON (ingredients/steps) проверить, что не происходит лишних преобразований.

## Ручка `DELETE /recipes/:id`
- Обычно дешёвый endpoint, оптимизация минимальна.

## Ручка `GET /recipes/proposed/all`
- Добавить пагинацию/лимит, чтобы endpoint не деградировал при росте числа предложенных рецептов.

## Ручка `POST /recipes/propose`
- Write endpoint; значимого ускорения обычно нет.

## Ручка `POST /recipes/proposed/:id/publish`
- При переносе в published делать транзакционно и без лишних повторных чтений.

## Ручка `POST /recipes/:id/like`
- Для toggle критична уникальность `(userId, recipeId)` и атомарная операция upsert/delete.
- При высокой конкуренции полезен счётчик лайков, обновляемый атомарно.

## Настройка сервиса в целом
- Основные кандидаты на ускорение: `GET /recipes` и `GET /recipes/:id`.
- Проверить индексы в PostgreSQL (или Mongo, если используется) под поиск и сортировки.
- Добавить метрики времени по отдельным частям сборки recipe-details (recipe/likes/comments/isLiked), чтобы видеть реальный bottleneck.
