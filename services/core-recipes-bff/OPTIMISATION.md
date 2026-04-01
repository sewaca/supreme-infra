# OPTIMISATION — core-recipes-bff

## Что уже есть в БД (проверено по SQL)

- Есть индексы: `published_recipes(author_user_id, difficulty, cooking_time, created_at)`, `proposed_recipes(author_user_id, submitted_at)`, `recipe_comments(recipe_id, author_user_id, created_at)`, `recipe_likes(user_id)`, `recipe_likes(recipe_id)`.
- Есть уникальность likes: `UNIQUE (user_id, recipe_id)`.
- Связи FK между recipes/comments/likes отсутствуют намеренно (кросс-сервисная модель), но это повышает риск «висячих» записей.

## GET /recipes

- Для фильтра по ингредиентам (`TEXT[]`) и text-search по title/description текущих индексов недостаточно.
- Добавить GIN: `published_recipes(ingredients)` и FTS/trigram индекс для title/description.

## GET /recipes/:id

- По БД lookup быстрый (PK).
- По коду: распараллелить получение likes/comments/isLiked (`Promise.all`).

## PUT /recipes/:id

- PK update быстрый.
- Дополнительные чтения likes/comments после update можно делать параллельно.

## DELETE /recipes/:id

- PK delete быстрый.
- Из-за отсутствия FK стоит явно чистить комментарии/лайки или иметь фоновые cleanup-задачи.

## GET /recipes/proposed/all

- Индекс `submitted_at` уже есть — использовать сортировку по нему.
- Добавить пагинацию, чтобы ручка не деградировала.

## POST /recipes/propose

- Insert быстрый; индексы достаточны.

## POST /recipes/proposed/:id/publish

- Важно выполнять транзакционно (insert published + delete proposed).

## POST /recipes/:id/like

- Уникальный индекс `(user_id, recipe_id)` уже правильно защищает от дублей.
- Для hot-path полезен счётчик likes в `published_recipes` (денормализация) вместо постоянного COUNT.

## Настройка сервиса в целом

- Главный пробел в БД — индексация поиска рецептов (FTS/trigram/GIN по ингредиентам).
- Главный пробел в коде — последовательные запросы при сборке details.
