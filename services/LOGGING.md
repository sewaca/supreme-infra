# Logging с OpenTelemetry и Loki

## Что экспортируется в Loki

### 1. Console Logs (все методы)

Все вызовы `console.*` автоматически перехватываются и отправляются в Loki:

```typescript
console.log('Info message'); // → Loki (severity: INFO)
console.error('Error occurred'); // → Loki (severity: ERROR)
console.warn('Warning message'); // → Loki (severity: WARN)
console.info('Info message'); // → Loki (severity: INFO)
console.debug('Debug message'); // → Loki (severity: DEBUG)
```

**Важно**: Логи также выводятся в stdout/stderr (оригинальное поведение сохранено).

### 2. HTTP Spans (трейсы)

Автоматически создаются spans для всех HTTP запросов:

- Входящие запросы (server)
- Исходящие запросы (client)
- Включают метаданные: method, route, status_code, url.path

### 3. Автоматическая инструментация

Через `getNodeAutoInstrumentations` собираются spans от:

- HTTP/HTTPS запросов
- Fastify (backend)
- Next.js (frontend)
- И других поддерживаемых библиотек

**Отключено**: `@opentelemetry/instrumentation-fs` (чтобы не засорять логи)

## Формат логов в Loki

Каждый лог содержит:

- `service_name`: `backend` или `frontend`
- `severity_number`: числовой уровень (5=DEBUG, 9=INFO, 13=WARN, 17=ERROR)
- `severity_text`: текстовый уровень (DEBUG, INFO, WARN, ERROR)
- `body`: текст лога
- `timestamp`: время создания лога

## Примеры запросов в Loki

### Все логи от backend

```logql
{service_name="backend"}
```

### Только ошибки

```logql
{service_name="backend"} |= "ERROR"
```

### Логи с фильтром по тексту

```logql
{service_name="frontend"} |~ "user.*login"
```

### Подсчёт ошибок за последний час

```logql
sum(count_over_time({service_name="backend"} |= "ERROR" [1h]))
```

## Как использовать в коде

### Простое логирование

```typescript
// Просто используй console.log как обычно
console.log('User logged in', { userId: 123 });
console.error('Failed to connect to database', error);
```

### Логирование объектов

```typescript
const user = { id: 123, name: 'John' };
console.log('User data:', user);
// → В Loki: "User data: {"id":123,"name":"John"}"
```

### Логирование ошибок

```typescript
try {
  // some code
} catch (error) {
  console.error('Operation failed:', error);
  // Ошибка будет в Loki с severity=ERROR
}
```

## Конфигурация

### Изменить endpoint Loki

Установи переменную окружения:

```bash
LOKI_ENDPOINT=http://custom-loki:3100/otlp/v1/logs
```

### По умолчанию

```
http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs
```

**Примечание**: Используется Loki Gateway (Nginx) как единая точка входа. Anti-affinity отключен для работы на single-node кластере.

## Troubleshooting

### Логи не появляются в Loki

1. Проверь, что Loki запущен:

```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki
```

2. Проверь логи самого сервиса:

```bash
kubectl logs -n default -l app=backend --tail=50
```

3. Проверь, что OTLP endpoint доступен:

```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n monitoring -- \
  curl -v http://loki-gateway/otlp/v1/logs
```

### Слишком много логов

Отключи debug логи в production:

```typescript
// Создай wrapper для console.debug
if (process.env.NODE_ENV !== 'production') {
  console.debug('Debug info');
}
```

### Логи не форматируются правильно

Убедись, что `instrumentation.ts` (backend) или `instrumentation.nodejs.ts` (frontend) загружается **первым**:

**Backend (NestJS):**

```typescript
// main.ts
import './instrumentation'; // ПЕРВАЯ строка!
import { NestFactory } from '@nestjs/core';
```

**Frontend (Next.js):**

```typescript
// next.config.ts
export default {
  experimental: {
    instrumentationHook: true, // Включить instrumentation
  },
};
```

## Retention

Логи хранятся **31 день** (744 часа), после чего автоматически удаляются.

Настраивается в `infra/helmcharts/loki/values.yaml`:

```yaml
loki:
  loki:
    limits_config:
      retention_period: 744h # 31 days
```
