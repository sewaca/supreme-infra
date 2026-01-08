# @supreme-int/nestjs-shared

Переиспользуемые модули и сервисы для NestJS приложений в Supreme Infrastructure.

## Установка

```bash
pnpm add @supreme-int/nestjs-shared
```

## Модули

### Logger Module

Кастомный NestJS логгер с интеграцией OpenTelemetry.

#### Установка

```typescript
import { Module } from "@nestjs/common";
import { LoggerModule } from "@supreme-int/nestjs-shared";

@Module({
  imports: [
    LoggerModule, // Глобальный модуль
    // ... другие модули
  ],
})
export class AppModule {}
```

#### Настройка OpenTelemetry

В `main.ts` или `instrumentation.ts`:

```typescript
import { loggerProvider } from "./instrumentation";
import { OtelLoggerService } from "@supreme-int/nestjs-shared";

// После создания приложения
const app = await NestFactory.create(AppModule);
const logger = app.get(OtelLoggerService);

// Подключаем OpenTelemetry logger
const otelLogger = loggerProvider.getLogger("nestjs-logger");
logger.setOtelLogger(otelLogger);

// Устанавливаем как глобальный логгер
app.useLogger(logger);
```

#### Использование

```typescript
import { Injectable } from "@nestjs/common";
import { OtelLoggerService } from "@supreme-int/nestjs-shared";

@Injectable()
export class UsersService {
  constructor(private readonly logger: OtelLoggerService) {}

  async findAll() {
    this.logger.log("Fetching all users", "UsersService");

    try {
      const users = await this.repository.find();
      this.logger.debug(`Found ${users.length} users`, "UsersService");
      return users;
    } catch (error) {
      this.logger.error("Failed to fetch users", error.stack, "UsersService");
      throw error;
    }
  }
}
```

#### API

- `log(message, context?)` - INFO level
- `error(message, trace?, context?)` - ERROR level
- `warn(message, context?)` - WARN level
- `debug(message, context?)` - DEBUG level
- `verbose(message, context?)` - DEBUG level
- `fatal(message, context?)` - ERROR level

## Разработка

```bash
# Сборка
pnpm run build

# Watch mode
pnpm run dev
```

## Лицензия

MIT
