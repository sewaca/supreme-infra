# FSD Structure - core-recipes-bff

Этот сервис организован по методологии Feature-Sliced Design (FSD).

## Структура

```
src/
├── entities/                    # Бизнес-сущности (слой entities)
│   ├── recipes/                 # Сущность рецептов
│   │   ├── model/              # Модели данных
│   │   │   ├── PublishedRecipe.entity.ts
│   │   │   ├── ProposedRecipe.entity.ts
│   │   │   ├── recipes.service.ts
│   │   │   ├── recipe.types.ts
│   │   │   └── recipe.schemas.ts
│   │   └── api/                # API слой
│   │       ├── Recipes.controller.ts
│   │       └── Recipes.module.ts
│   └── comments/               # Сущность комментариев
│       ├── model/
│       │   └── RecipeComment.entity.ts
│       └── api/
│           ├── comments.service.ts
│           └── comments.module.ts
│
├── features/                   # Фичи (слой features)
│   └── RecipeLikes/           # Фича лайков рецептов
│       ├── model/
│       │   └── RecipeLike.entity.ts
│       └── api/
│           ├── RecipeLikes.controller.ts
│           ├── RecipeLikes.service.ts
│           └── RecipeLikes.module.ts
│
├── shared/                     # Общий код (слой shared)
│   ├── guards/                # JWT guards
│   ├── decorators/            # Декораторы
│   ├── pipes/                 # Pipes для валидации
│   └── database/              # Конфигурация БД
│
├── app.module.ts              # Корневой модуль
├── main.ts                    # Точка входа
└── instrumentation.ts         # OpenTelemetry

```

## Слои

### Entities (Сущности)

Базовые бизнес-сущности, которые могут использоваться в разных фичах:

- **recipes** - опубликованные и предложенные рецепты (включая предложение, модерацию и публикацию)
- **comments** - комментарии к рецептам

### Features (Фичи)

Изолированные модули с конкретной бизнес-логикой:

- **RecipeLikes** - функционал лайков (включая entity RecipeLike)

### Shared (Общее)

Переиспользуемый код, который не привязан к конкретной бизнес-логике.

## API Endpoints

### Recipes (entities/recipes)

**Опубликованные рецепты:**

- `GET /recipes` - список опубликованных рецептов
- `GET /recipes/:id` - полная информация о рецепте (с лайками и комментариями)
  - `:id` может быть числом (published) или строкой `proposed:{id}` (proposed)
- `PUT /recipes/:id` - обновить рецепт (published или proposed, модераторы)
  - `:id` может быть числом (published) или строкой `proposed:{id}` (proposed)
- `DELETE /recipes/:id` - удалить рецепт (published или proposed, модераторы)
  - `:id` может быть числом (published) или строкой `proposed:{id}` (proposed)

**Предложенные рецепты:**

- `POST /recipes/proposed/submit` - предложить рецепт (возвращает `id: "proposed:{id}"`)
- `GET /recipes/proposed/all` - список предложенных рецептов (только модераторы)
- `POST /recipes/proposed/:id/publish` - опубликовать предложенный рецепт (модераторы)
  - `:id` может быть числом или строкой `proposed:{id}`

### RecipeLikes (features/RecipeLikes)

- `POST /recipes/:id/like` - поставить/убрать лайк

### Формат ID

- **Published рецепты**: числовой ID (например, `1`, `2`, `3`)
- **Proposed рецепты**: строка с префиксом `proposed:` (например, `proposed:1`, `proposed:2`)
- Это позволяет избежать конфликтов ID между двумя таблицами

## Принципы

1. **Изоляция модулей** - каждый модуль независим и может быть легко удален/заменен
2. **Однонаправленные зависимости** - features могут импортировать entities, но не наоборот
3. **Явные границы** - каждый слой имеет четкую ответственность
4. **Переиспользование** - entities могут использоваться в разных features

## База данных

Таблицы:

- `published_recipes` - опубликованные рецепты
- `proposed_recipes` - предложенные рецепты (ожидают модерации)
- `recipe_comments` - комментарии
- `recipe_likes` - лайки

Все таблицы находятся в БД `core-recipes-bff-db`.
