# Core Recipes BFF Database

База данных для сервиса рецептов.

## Структура

### Таблицы

#### published_recipes

Опубликованные рецепты, доступные всем пользователям.

#### proposed_recipes

Предложенные пользователями рецепты, ожидающие модерации.

#### recipe_comments

Комментарии к рецептам.

#### recipe_likes

Лайки рецептов от пользователей.

## Миграция данных

Данные из `services/backend/src/shared/recipes-mock.json` автоматически загружаются при инициализации БД.

### Генерация миграции

Если нужно перегенерировать SQL-миграцию:

```bash
cd infra/databases/core-recipes-bff-db
npx tsx generate-migration.ts
```

Это создаст файл `migration-data.sql` с INSERT-запросами для всех рецептов и комментариев.

## Файлы

- `init.sql` - схема БД и импорт данных
- `migration-data.sql` - данные рецептов (генерируется автоматически)
- `generate-migration.ts` - скрипт для генерации миграции
- `service.yaml` - конфигурация Kubernetes для БД

## Связь с другими БД

Таблицы содержат поля `author_user_id` и `user_id`, которые ссылаются на пользователей из БД `core-auth-bff-db`.

**Важно:** Foreign key constraints не используются, так как таблицы находятся в разных БД. Связь поддерживается на уровне приложения.
