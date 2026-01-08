# Database Module

Общий модуль для работы с базой данных PostgreSQL через TypeORM в NestJS приложениях.

## Возможности

- 🔧 Готовая конфигурация TypeORM для PostgreSQL
- 🎯 Поддержка `SKIP_DB_CONNECTION` для генерации роутов без подключения к БД
- 📊 Кастомный логгер TypeORM с эмодзи и детальной информацией
- ✅ Валидация обязательных переменных окружения
- 🔄 Автоматическая синхронизация схемы в development режиме

## Использование

### Простой вариант (без entities)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, LoggerModule } from '@supreme-int/nestjs-shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ...createDatabaseImports(),
  ],
})
export class AppModule {}
```

### С указанием entities

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, LoggerModule } from '@supreme-int/nestjs-shared';
import { UserEntity } from './entities/user.entity';
import { PostEntity } from './entities/post.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ...createDatabaseImports({
      entities: [UserEntity, PostEntity],
    }),
  ],
})
export class AppModule {}
```

### С условным отключением модулей, зависящих от БД

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, LoggerModule } from '@supreme-int/nestjs-shared';
import { UserEntity } from './entities/user.entity';
import { UsersModule } from './features/users/users.module';

const skipDbConnection = process.env.SKIP_DB_CONNECTION === 'true';
const dbDependentModules = skipDbConnection ? [] : [UsersModule];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ...createDatabaseImports({ entities: [UserEntity] }),
    ...dbDependentModules,
  ],
})
export class AppModule {}
```

## Переменные окружения

| Переменная | Описание | Обязательная | По умолчанию |
|-----------|----------|--------------|--------------|
| `DB_HOST` | Хост PostgreSQL | Нет | `localhost` |
| `DB_PORT` | Порт PostgreSQL | Нет | `5432` |
| `DB_NAME` | Имя базы данных | Да | - |
| `DB_USER` | Пользователь БД | Да | - |
| `DB_PASSWORD` | Пароль БД | Да | - |
| `NODE_ENV` | Окружение | Да | - |
| `SKIP_DB_CONNECTION` | Пропустить подключение к БД | Нет | `false` |

## SKIP_DB_CONNECTION

Специальная переменная окружения для генерации роутов без реального подключения к БД.

### Когда использовать

- При генерации конфигурации роутов через `pnpm run generate:router`
- При запуске приложения для извлечения метаданных без БД
- В CI/CD пайплайнах для статического анализа

### Как работает

Когда `SKIP_DB_CONNECTION=true`:
1. TypeORM модуль возвращает минимальную конфигурацию
2. Не выполняется реальное подключение к БД
3. Установлено `retryAttempts: 0` для быстрого фейла
4. Приложение может запуститься и зарегистрировать роуты

### Пример использования

```bash
SKIP_DB_CONNECTION=true \
NODE_ENV=development \
DB_NAME=dummy \
DB_USER=dummy \
DB_PASSWORD=dummy \
pnpm run dev
```

## API

### `createDatabaseImports(options?)`

Создает массив модулей TypeORM для импорта в `@Module`.

**Параметры:**
- `options.entities?: TypeOrmModuleOptions['entities']` - Массив entity классов

**Возвращает:** `DynamicModule[]`

### `createDatabaseConfig(configService, options?)`

Создает конфигурацию TypeORM на основе переменных окружения.

**Параметры:**
- `configService: ConfigService` - Сервис конфигурации NestJS
- `options.entities?: TypeOrmModuleOptions['entities']` - Массив entity классов

**Возвращает:** `TypeOrmModuleOptions`

### `CustomTypeOrmLogger`

Кастомный логгер TypeORM с красивым форматированием и эмодзи.

**Возможности:**
- 📊 Логирование выполненных запросов
- ❌ Логирование ошибок запросов
- 🐌 Предупреждения о медленных запросах (>1s)
- 🏗️ Логирование изменений схемы
- 🔄 Логирование миграций

## Примеры логов

```
🔌 Connecting to database: {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'myuser',
  environment: 'development'
}

📊 Query executed [DB: myapp@localhost:5432 as myuser]
SELECT * FROM users WHERE id = $1

🐌 Slow query (1523ms) [DB: myapp@localhost:5432 as myuser]
SELECT * FROM posts JOIN users ON posts.user_id = users.id

❌ Query failed [DB: myapp@localhost:5432 as myuser]
INSERT INTO users (email) VALUES ($1)
Error: duplicate key value violates unique constraint "users_email_key"
```

## Миграция с локальной конфигурации

### Было

```typescript
// src/shared/database/database-config.factory.ts
export function createDatabaseConfig(configService: ConfigService) {
  // ... локальная реализация
}

// src/app.module.ts
import { createDatabaseConfig } from './shared/database/database-config.factory';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createDatabaseConfig,
    }),
  ],
})
export class AppModule {}
```

### Стало

```typescript
// src/app.module.ts
import { createDatabaseImports } from '@supreme-int/nestjs-shared';

@Module({
  imports: [
    ...createDatabaseImports({ entities: [UserEntity] }),
  ],
})
export class AppModule {}
```

## Лицензия

ISC

