# OtelLoggerService

Кастомный NestJS логгер с интеграцией OpenTelemetry для отправки логов в Loki.

## Возможности

- ✅ Расширяет стандартный `ConsoleLogger` от NestJS
- ✅ Автоматически отправляет все логи в OpenTelemetry (Loki)
- ✅ Сохраняет вывод в консоль для локальной разработки
- ✅ Поддерживает все уровни логирования: `log`, `error`, `warn`, `debug`, `verbose`, `fatal`
- ✅ Добавляет контекст и trace информацию к логам
- ✅ Глобально доступен через DI

## Установка

Логгер уже подключен глобально в `app.module.ts` через `LoggerModule`.

## Использование

### В сервисах и контроллерах

```typescript
import { Injectable } from "@nestjs/common";
import { OtelLoggerService } from "@/shared/logger";

@Injectable()
export class UsersService {
  constructor(private readonly logger: OtelLoggerService) {}

  async findAll() {
    this.logger.log("Fetching all users", "UsersService");

    try {
      const users = await this.userRepository.find();
      this.logger.debug(`Found ${users.length} users`, "UsersService");
      return users;
    } catch (error) {
      this.logger.error("Failed to fetch users", error.stack, "UsersService");
      throw error;
    }
  }
}
```

### Без DI (в утилитах, middleware)

```typescript
import { OtelLoggerService } from "@/shared/logger";

const logger = new OtelLoggerService();

export function someUtilityFunction() {
  logger.log("Utility function called", "UtilityContext");
  logger.warn("This is a warning", "UtilityContext");
}
```

### Вместо console.log

**Было:**

```typescript
console.log("User created:", user);
console.error("Error occurred:", error);
console.warn("Deprecated API used");
```

**Стало:**

```typescript
this.logger.log("User created", "UsersController");
this.logger.error("Error occurred", error.stack, "UsersController");
this.logger.warn("Deprecated API used", "UsersController");
```

## API

### Методы

#### `log(message: unknown, context?: string)`

Информационное сообщение (INFO level)

```typescript
this.logger.log("Server started", "Bootstrap");
this.logger.log({ userId: 123, action: "login" }, "AuthService");
```

#### `error(message: unknown, trace?: string, context?: string)`

Сообщение об ошибке (ERROR level)

```typescript
this.logger.error("Database connection failed", error.stack, "DatabaseService");
```

#### `warn(message: unknown, context?: string)`

Предупреждение (WARN level)

```typescript
this.logger.warn("API rate limit approaching", "RateLimitMiddleware");
```

#### `debug(message: unknown, context?: string)`

Отладочная информация (DEBUG level)

```typescript
this.logger.debug("Cache hit for key: user:123", "CacheService");
```

#### `verbose(message: unknown, context?: string)`

Подробная информация (DEBUG level)

```typescript
this.logger.verbose("Request headers", "HttpInterceptor");
```

#### `fatal(message: unknown, context?: string)`

Критическая ошибка (ERROR level)

```typescript
this.logger.fatal("Application crashed", "Bootstrap");
```

## Структура логов в Loki

Каждый лог содержит:

```json
{
  "severityNumber": 9,
  "severityText": "INFO",
  "body": "[UsersService] Fetching all users",
  "attributes": {
    "context": "UsersService"
  }
}
```

Для ошибок:

```json
{
  "severityNumber": 17,
  "severityText": "ERROR",
  "body": "[UsersService] Failed to fetch users",
  "attributes": {
    "context": "UsersService",
    "trace": "Error: Connection timeout\n    at ..."
  }
}
```

## Уровни логирования

| Метод     | Severity Number | Severity Text | Когда использовать                    |
| --------- | --------------- | ------------- | ------------------------------------- |
| `debug`   | 5               | DEBUG         | Детальная отладочная информация       |
| `verbose` | 5               | DEBUG         | Очень подробная информация            |
| `log`     | 9               | INFO          | Обычные информационные сообщения      |
| `warn`    | 13              | WARN          | Предупреждения, не критичные проблемы |
| `error`   | 17              | ERROR         | Ошибки, требующие внимания            |
| `fatal`   | 17              | ERROR         | Критические ошибки, падение системы   |

## Интеграция с OpenTelemetry

Логгер автоматически использует `loggerProvider` из `instrumentation.ts`:

```typescript
private otelLogger = loggerProvider.getLogger('nestjs-logger');
```

Все логи отправляются в Loki через OTLP endpoint, настроенный в `LOKI_ENDPOINT`.

## Best Practices

### 1. Всегда указывайте контекст

```typescript
// ✅ Хорошо
this.logger.log("User created", "UsersController");

// ❌ Плохо
this.logger.log("User created");
```

### 2. Используйте правильные уровни

```typescript
// ✅ Хорошо
this.logger.debug("Cache miss", "CacheService");
this.logger.log("User logged in", "AuthService");
this.logger.warn("Slow query detected", "DatabaseService");
this.logger.error("Payment failed", error.stack, "PaymentService");

// ❌ Плохо
this.logger.log("Cache miss", "CacheService"); // Должно быть debug
this.logger.error("User logged in", "", "AuthService"); // Должно быть log
```

### 3. Логируйте структурированные данные

```typescript
// ✅ Хорошо
this.logger.log({ userId: 123, action: "purchase", amount: 99.99 }, "OrderService");

// ❌ Плохо
this.logger.log(`User 123 made a purchase of 99.99`, "OrderService");
```

### 4. Добавляйте stack trace для ошибок

```typescript
// ✅ Хорошо
try {
  await riskyOperation();
} catch (error) {
  this.logger.error('Operation failed', error.stack, 'MyService');
}

// ❌ Плохо
catch (error) {
  this.logger.error('Operation failed', '', 'MyService');
}
```

## Просмотр логов

### Локально (консоль)

Логи выводятся в консоль с цветным форматированием NestJS.

### В Grafana Loki

1. Откройте Grafana
2. Перейдите в Explore
3. Выберите Loki как data source
4. Используйте фильтры:

```logql
{service_name="backend"} |= "UsersService"
```

Фильтр по уровню:

```logql
{service_name="backend"} | json | severityText="ERROR"
```

## Производительность

- Логи отправляются асинхронно через `BatchLogRecordProcessor`
- Не блокирует основной поток выполнения
- Автоматическая буферизация и пакетная отправка
- Graceful shutdown при завершении приложения

## Troubleshooting

### Логи не появляются в Loki

1. Проверьте `LOKI_ENDPOINT` в `.env`:

   ```
   LOKI_ENDPOINT=http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs
   ```

2. Убедитесь, что OpenTelemetry SDK запущен:

   ```
   OpenTelemetry SDK started for backend service
   ```

3. Проверьте connectivity к Loki:
   ```bash
   curl -v $LOKI_ENDPOINT
   ```

### Дублирование логов

Если видите дублирующиеся логи, убедитесь, что не используете одновременно:

- `console.log()` И `logger.log()`
- Несколько экземпляров логгера

### Слишком много логов

Настройте уровень логирования в `main.ts`:

```typescript
app.useLogger(["error", "warn", "log"]); // Отключить debug и verbose
```
