# OtelLogger Setup Summary

## ✅ Что сделано

### 1. Создан кастомный NestJS логгер с OpenTelemetry интеграцией

**Пакет:** `@supreme-int/nestjs-shared`

**Файлы в пакете:**

- `packages/nestjs-shared/src/logger/otel-logger.service.ts` - основной логгер
- `packages/nestjs-shared/src/logger/logger.module.ts` - модуль логгера
- `packages/nestjs-shared/src/logger/index.ts` - barrel export
- `packages/nestjs-shared/README.md` - документация пакета

### 2. Интеграция с приложением

**Обновленные файлы:**

- `src/app.module.ts` - добавлен `LoggerModule` (глобальный)
- `src/main.ts` - установлен кастомный логгер через `app.useLogger()`
- `src/features/Auth/model/Users.service.ts` - пример использования

### 3. Возможности

✅ **Двойное логирование:**

- В консоль (для локальной разработки)
- В OpenTelemetry → Loki (для production)

✅ **Все уровни логирования:**

- `log` - INFO
- `error` - ERROR (с trace)
- `warn` - WARN
- `debug` - DEBUG
- `verbose` - DEBUG
- `fatal` - ERROR

✅ **Структурированные логи:**

- Severity number и text
- Контекст (имя сервиса/контроллера)
- Trace для ошибок
- Поддержка объектов (автоматический JSON.stringify)

✅ **Глобальная доступность:**

- Через DI в любом сервисе/контроллере
- Можно создать экземпляр вручную в утилитах

## 📊 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    NestJS Application                   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Controller  │  │   Service    │  │  Middleware  │   │
│  │              │  │              │  │              │   │
│  │  logger.log()│  │ logger.warn()│  │logger.error()│   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │ OtelLoggerService│                   │
│                  │  (extends        │                   │
│                  │   ConsoleLogger) │                   │
│                  └────────┬────────┘                    │
│                           │                             │
│                  ┌────────┴────────┐                    │
│                  │                 │                    │
│         ┌────────▼────────┐ ┌─────▼──────┐              │
│         │   Console.log   │ │ OTel Logger│              │
│         │   (local dev)   │ │ Provider   │              │
│         └─────────────────┘ └─────┬──────┘              │
│                                   │                     │
└───────────────────────────────────┼─────────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │  BatchProcessor   │
                          │  (async batching) │
                          └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │  OTLP Exporter    │
                          │  (HTTP)           │
                          └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   Grafana Loki    │
                          │   (monitoring)    │
                          └───────────────────┘
```

## 🚀 Использование

### В сервисах

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

### В контроллерах

```typescript
import { Controller, Get } from "@nestjs/common";
import { OtelLoggerService } from "@supreme-int/nestjs-shared";

@Controller("users")
export class UsersController {
  constructor(private readonly logger: OtelLoggerService) {}

  @Get()
  async findAll() {
    this.logger.log("GET /users endpoint called", "UsersController");
    // ...
  }
}
```

### Замена console.log

**Было:**

```typescript
console.log("User created:", user);
console.error("Error:", error);
console.warn("Warning:", warning);
```

**Стало:**

```typescript
this.logger.log("User created", "MyService");
this.logger.error("Error occurred", error.stack, "MyService");
this.logger.warn("Warning detected", "MyService");
```

## 📝 Формат логов в Loki

```json
{
  "timestamp": "2024-01-08T12:00:00.000Z",
  "severityNumber": 9,
  "severityText": "INFO",
  "body": "[UsersService] Fetching all users",
  "attributes": {
    "service.name": "backend",
    "context": "UsersService"
  }
}
```

## 🔍 Просмотр логов в Grafana

### LogQL запросы

Все логи сервиса:

```logql
{service_name="backend"}
```

По контексту:

```logql
{service_name="backend"} |= "UsersService"
```

Только ошибки:

```logql
{service_name="backend"} | json | severityText="ERROR"
```

За последний час с фильтром:

```logql
{service_name="backend"} |= "database" | json | severityText=~"ERROR|WARN"
```

## 🎯 Best Practices

### 1. Всегда указывайте контекст

```typescript
✅ this.logger.log('Action completed', 'ServiceName');
❌ this.logger.log('Action completed');
```

### 2. Используйте правильные уровни

```typescript
✅ this.logger.debug('Cache hit', 'CacheService');      // Детали
✅ this.logger.log('User logged in', 'AuthService');    // Важные события
✅ this.logger.warn('Slow query', 'DatabaseService');   // Предупреждения
✅ this.logger.error('Payment failed', trace, 'PaymentService'); // Ошибки
```

### 3. Логируйте структурированные данные

```typescript
✅ this.logger.log({ userId: 123, action: 'login' }, 'AuthService');
❌ this.logger.log('User 123 logged in', 'AuthService');
```

### 4. Всегда добавляйте stack trace для ошибок

```typescript
✅ this.logger.error('Failed', error.stack, 'MyService');
❌ this.logger.error('Failed', '', 'MyService');
```

## 🔧 Настройка

### Уровни логирования в production

В `main.ts` можно ограничить уровни:

```typescript
// Только важные логи
app.useLogger(["error", "warn", "log"]);

// Все логи (по умолчанию)
app.useLogger(["error", "warn", "log", "debug", "verbose"]);
```

### Переменные окружения

```env
# Endpoint для отправки логов
LOKI_ENDPOINT=http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs

# Имя сервиса (опционально, по умолчанию 'backend')
SERVICE_NAME=backend
```

## 📦 Зависимости

Все необходимые пакеты уже установлены:

- `@opentelemetry/api-logs`
- `@opentelemetry/sdk-logs`
- `@opentelemetry/exporter-logs-otlp-http`
- `@nestjs/common` (для ConsoleLogger)

## 🎉 Результат

Теперь все логи из NestJS приложения:

1. ✅ Выводятся в консоль (для разработки)
2. ✅ Отправляются в Loki через OpenTelemetry (для мониторинга)
3. ✅ Имеют структурированный формат
4. ✅ Содержат контекст и severity
5. ✅ Доступны для поиска в Grafana

## 📚 Дополнительная документация

См. `src/shared/logger/README.md` для подробной документации по API и примеров использования.
