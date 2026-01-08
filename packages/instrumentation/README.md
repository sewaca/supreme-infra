# @supreme-int/instrumentation

Пакет для настройки OpenTelemetry инструментации в микросервисной архитектуре.

## Структура (FSD)

```
src/
├── index.ts                                    # Public API
├── shared/
│   └── config/
│       └── constants.ts                        # Дефолтные значения конфигурации
├── entities/
│   └── otel/                                   # OpenTelemetry сущность
│       ├── model/
│       │   ├── SeverityText.ts                 # Enum уровней логирования
│       │   └── types.ts                        # Типы конфигурации и SDK
│       └── lib/
│           ├── create-sdk.ts                   # Создание SDK
│           └── start-sdk.ts                    # Запуск SDK
└── features/                                   # Изолированные фичи
    ├── console-patching/
    │   └── lib/
    │       └── patch-console.ts                # Патчинг console
    ├── error-handling/
    │   └── lib/
    │       └── setup-handlers.ts               # Обработка ошибок
    ├── nest-instrumentation/
    │   └── lib/
    │       └── create-config.ts                # Конфигурация для NestJS
    └── next-instrumentation/
        └── lib/
            └── create-config.ts                # Конфигурация для Next.js
```

## Использование

### NestJS (Backend)

```typescript
import {
  createOpenTelemetrySDK,
  startOpenTelemetrySDK,
  setupErrorHandlers,
  createNestInstrumentationConfig,
  patchConsole,
} from "@supreme-int/instrumentation";

const config = {
  serviceName: "backend",
  lokiEndpoint: process.env.LOKI_ENDPOINT,
  prometheusPort: 9464,
};

const otelSDK = createOpenTelemetrySDK({
  ...config,
  instrumentationConfig: createNestInstrumentationConfig(),
});

startOpenTelemetrySDK(otelSDK, config);

const consoleLogger = otelSDK.loggerProvider.getLogger("console-interceptor");
patchConsole((logRecord) => consoleLogger.emit(logRecord));

const errorLogger = otelSDK.loggerProvider.getLogger("error-handler");
setupErrorHandlers(errorLogger);
```

### Next.js (Frontend)

```typescript
import {
  createOpenTelemetrySDK,
  startOpenTelemetrySDK,
  setupErrorHandlers,
  createNextInstrumentationConfig,
  patchConsole,
} from "@supreme-int/instrumentation";

const config = {
  serviceName: "frontend",
  lokiEndpoint: process.env.LOKI_ENDPOINT,
  prometheusPort: 9464,
};

const otelSDK = createOpenTelemetrySDK({
  ...config,
  instrumentationConfig: createNextInstrumentationConfig(),
});

startOpenTelemetrySDK(otelSDK, config);

const consoleLogger = otelSDK.loggerProvider.getLogger("console-interceptor");
patchConsole((logRecord) => consoleLogger.emit(logRecord));

const errorLogger = otelSDK.loggerProvider.getLogger("error-handler");
setupErrorHandlers(errorLogger);
```

## API

### createOpenTelemetrySDK

Создаёт и настраивает OpenTelemetry SDK.

```typescript
function createOpenTelemetrySDK(config: OpenTelemetryConfig): OpenTelemetrySDK;
```

### startOpenTelemetrySDK

Запускает SDK и настраивает graceful shutdown.

```typescript
function startOpenTelemetrySDK(otelSDK: OpenTelemetrySDK, config: {...}): void
```

### patchConsole

Патчит глобальные методы console для перехвата логов.

```typescript
function patchConsole(customLoggerEmit: (logRecord: LogRecord) => void): void;
```

### setupErrorHandlers

Настраивает обработчики для необработанных исключений и отклонений промисов.

```typescript
function setupErrorHandlers(logger: Logger): void;
```

### createNestInstrumentationConfig

Создаёт конфигурацию инструментации для NestJS приложений.

```typescript
function createNestInstrumentationConfig(): InstrumentationConfigMap;
```

### createNextInstrumentationConfig

Создаёт конфигурацию инструментации для Next.js приложений.

```typescript
function createNextInstrumentationConfig(): InstrumentationConfigMap;
```

## Архитектура

Пакет организован по методологии Feature-Sliced Design (FSD):

- **shared/** - общие ресурсы (константы конфигурации)
- **entities/** - бизнес-сущности (OpenTelemetry SDK, типы, модели)
- **features/** - изолированные фичи (патчинг, обработка ошибок, конфигурации для фреймворков)

Каждая фича независима и может использоваться отдельно.
