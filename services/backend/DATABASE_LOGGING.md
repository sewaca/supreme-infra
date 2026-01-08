# Database Logging

## Обзор

Backend логирует все обращения к базе данных для отладки и мониторинга.

## Что логируется

### 1. Подключение к БД (при старте)

```
🔌 Connecting to database: {
  host: 'postgresql-backend',
  port: 5432,
  database: 'backend_db',
  username: 'backend_user',
  environment: 'production'
}
```

### 2. Каждый SQL запрос

```
📊 Query executed [DB: backend_db@postgresql-backend:5432 as backend_user]
SELECT "UserEntity"."id", "UserEntity"."email", ... FROM "users" "UserEntity" WHERE "UserEntity"."email" = $1
Parameters: ["admin@example.com"]
```

### 3. Ошибки запросов

```
❌ Query failed [DB: backend_db@postgresql-backend:5432 as backend_user]
SELECT ... FROM "users"
Error: relation "users" does not exist
```

### 4. Медленные запросы (>1s)

```
🐌 Slow query (1523ms) [DB: backend_db@postgresql-backend:5432 as backend_user]
SELECT * FROM users WHERE ...
```

## Компоненты

### CustomTypeOrmLogger

**Файл**: `src/shared/database/typeorm-logger.ts`

Кастомный logger для TypeORM, который:

- Логирует все SQL запросы с параметрами
- Показывает информацию о БД (host, port, database, user)
- Выделяет ошибки и медленные запросы
- Использует эмодзи для быстрой идентификации

### createDatabaseConfig

**Файл**: `src/shared/database/database-config.factory.ts`

Фабрика для создания конфигурации TypeORM:

- Валидирует обязательные переменные окружения
- Логирует параметры подключения при старте
- Настраивает logger и другие опции TypeORM
- Выбрасывает ошибки если не установлены: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `NODE_ENV`

## Настройка

В `app.module.ts`:

```typescript
import { createDatabaseConfig } from "./shared/database/database-config.factory";

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: createDatabaseConfig,
});
```

В `database-config.factory.ts`:

```typescript
return {
  // ... connection options
  logging: true, // Включить логирование
  logger: new CustomTypeOrmLogger(), // Кастомный logger
  maxQueryExecutionTime: 1000, // Порог для медленных запросов (мс)
};
```

## Уровни логирования

### В production

```typescript
logging: true,  // Всегда логируем для отладки
```

Логируются:

- ✅ Подключение к БД
- ✅ Все SQL запросы
- ✅ Ошибки
- ✅ Медленные запросы

### В development

То же самое + дополнительно:

- Schema build
- Migrations

## Просмотр логов

### В Kubernetes

```bash
# Логи backend
kubectl logs deployment/backend -n default --tail=100 -f

# Фильтр только логов БД
kubectl logs deployment/backend -n default --tail=100 | grep -E "(TypeORM|Database|Query)"
```

### Локально

```bash
# Запустить backend
cd services/backend
pnpm run start:dev

# Логи будут в консоли
```

## Примеры логов

### Успешный запуск

```
🔌 Connecting to database: {
  host: 'postgresql-backend',
  port: 5432,
  database: 'backend_db',
  username: 'backend_user',
  environment: 'production'
}
```

### Запрос пользователя

```
[TypeORM] 📊 Query executed [DB: backend_db@postgresql-backend:5432 as backend_user]
SELECT "UserEntity"."id" AS "UserEntity_id",
       "UserEntity"."email" AS "UserEntity_email",
       "UserEntity"."password" AS "UserEntity_password",
       "UserEntity"."name" AS "UserEntity_name",
       "UserEntity"."role" AS "UserEntity_role",
       "UserEntity"."created_at" AS "UserEntity_created_at"
FROM "users" "UserEntity"
WHERE "UserEntity"."email" = $1
LIMIT 1
Parameters: ["admin@example.com"]
```

### Ошибка

```
[TypeORM] ❌ Query failed [DB: backend_db@postgresql-backend:5432 as backend_user]
SELECT ... FROM "users"
Error: relation "users" does not exist
```

## Отключение логирования

Если нужно отключить логирование (не рекомендуется):

```typescript
// app.module.ts
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ...
    logging: false, // Отключить все логи
    // или
    logging: ["error"], // Только ошибки
    // или
    logging: ["query", "error"], // Запросы и ошибки
  }),
});
```

## Performance Impact

Логирование имеет минимальное влияние на производительность:

- Запросы логируются асинхронно
- Не блокируют выполнение запросов
- Overhead: ~1-2ms на запрос

В production это приемлемо для отладки и мониторинга.

## Troubleshooting

### Логи не появляются

1. Проверьте что `logging: true` в `app.module.ts`
2. Проверьте что `DatabaseHealthService` добавлен в providers
3. Перезапустите backend

### Слишком много логов

Можно настроить фильтрацию:

```typescript
logging: ['error', 'warn'],  // Только ошибки и предупреждения
```

Или отфильтровать в kubectl:

```bash
kubectl logs deployment/backend -n default | grep -v "Query executed"
```

## Best Practices

1. ✅ Всегда включайте логирование в production для отладки
2. ✅ Используйте `maxQueryExecutionTime` для выявления медленных запросов
3. ✅ Мониторьте логи на наличие ошибок
4. ✅ Анализируйте медленные запросы и оптимизируйте их
5. ❌ Не логируйте пароли и sensitive данные (TypeORM не логирует пароли из параметров)

## Интеграция с мониторингом

В будущем можно интегрировать с:

- **Grafana Loki** - для агрегации логов
- **Prometheus** - для метрик (количество запросов, время выполнения)
- **Sentry** - для отслеживания ошибок

Логи уже структурированы и готовы к парсингу.
