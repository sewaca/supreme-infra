# @supreme-int/nestjs-shared

Переиспользуемые модули и сервисы для NestJS приложений в Supreme Infrastructure.

## Модули

### 📊 Database Module

Общий модуль для работы с PostgreSQL через TypeORM.

```typescript
import { createDatabaseImports } from "@supreme-int/nestjs-shared";

@Module({
  imports: [...createDatabaseImports({ entities: [UserEntity] })],
})
export class AppModule {}
```

[Подробная документация →](./src/database/README.md)

**Возможности:**

- Готовая конфигурация TypeORM
- Поддержка `SKIP_DB_CONNECTION` для генерации роутов
- Кастомный логгер с эмодзи
- Валидация переменных окружения

### 📝 Logger Module

Модуль логирования с интеграцией OpenTelemetry.

```typescript
import { LoggerModule, OtelLoggerService } from "@supreme-int/nestjs-shared";

@Module({
  imports: [LoggerModule],
})
export class AppModule {}
```

**Возможности:**

- Интеграция с OpenTelemetry
- Структурированное логирование
- Поддержка различных уровней логирования

## Установка

Пакет устанавливается автоматически как workspace dependency:

```bash
pnpm install
```

## Использование

```typescript
import { createDatabaseImports, LoggerModule, OtelLoggerService } from "@supreme-int/nestjs-shared";
```

## Лицензия

ISC
