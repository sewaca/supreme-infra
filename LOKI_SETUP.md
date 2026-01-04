# Grafana Loki Setup - Implementation Summary

## Что было сделано

### 1. Создан Helm Chart для Loki

**Расположение**: `infra/helmcharts/loki/`

Файлы:
- `Chart.yaml` - описание чарта с зависимостью от официального Loki chart
- `values.yaml` - конфигурация Loki в режиме SingleBinary
- `README.md` - базовая документация
- `DEPLOY.md` - полное руководство по развертыванию и использованию

**Ключевые особенности конфигурации**:
- Режим SingleBinary (упрощенное развертывание)
- Хранение на файловой системе с Persistent Volume (10Gi)
- Retention: 31 день
- OTLP endpoint для приема логов от микросервисов
- ServiceMonitor для мониторинга через Prometheus/VictoriaMetrics

### 2. Добавлены зависимости OpenTelemetry для логов

**Обновлены файлы**:
- `pnpm-workspace.yaml` - добавлены пакеты в catalog:
  - `@opentelemetry/sdk-logs`
  - `@opentelemetry/exporter-logs-otlp-http`
  - `@opentelemetry/api-logs`

- `services/backend/package.json` - добавлены зависимости для логирования
- `services/frontend/package.json` - добавлены зависимости для логирования

### 3. Настроен экспорт логов в Backend сервисе

**Файл**: `services/backend/src/instrumentation.ts`

Изменения:
- Добавлен импорт необходимых модулей для работы с логами
- Создан `OTLPLogExporter` для отправки логов в Loki
- Настроен `LoggerProvider` с `BatchLogRecordProcessor`
- Добавлена конфигурация endpoint через переменную окружения `LOKI_ENDPOINT`
- Обновлен shutdown handler для корректного завершения логгера
- Экспортирован `loggerProvider` для использования в приложении

### 4. Настроен экспорт логов в Frontend сервисе

**Файл**: `services/frontend/instrumentation.nodejs.ts`

Изменения:
- Добавлен импорт необходимых модулей для работы с логами
- Создан `OTLPLogExporter` для отправки логов в Loki
- Настроен `LoggerProvider` с `BatchLogRecordProcessor`
- Добавлена конфигурация endpoint через переменную окружения `LOKI_ENDPOINT`
- Обновлен shutdown handler для корректного завершения логгера

### 5. Обновлена конфигурация Grafana

**Файл**: `infra/helmcharts/grafana/values.yaml`

Добавлен datasource для Loki:
- URL: `http://loki-gateway.monitoring.svc.cluster.local`
- Настроена интеграция с VictoriaMetrics для корреляции логов и метрик
- Добавлен derived field для trace_id

### 6. Обновлены Helm charts сервисов

**Файлы**:
- `infra/helmcharts/backend-service/values.yaml`
- `infra/helmcharts/frontend-service/values.yaml`

Добавлена переменная окружения:
```yaml
env:
  LOKI_ENDPOINT: "http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs"
```

## Что нужно сделать для запуска

### 1. Установить зависимости

```bash
# В корне проекта
pnpm install
```

Это установит новые OpenTelemetry пакеты для работы с логами.

### 2. Пересобрать сервисы

```bash
# Backend
cd services/backend
pnpm run build

# Frontend
cd services/frontend
pnpm run build
```

### 3. Развернуть Loki в Kubernetes

```bash
# Добавить Grafana Helm репозиторий (если еще не добавлен)
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Установить Loki
helm install loki ./infra/helmcharts/loki \
  --namespace monitoring \
  --create-namespace
```

### 4. Обновить Grafana

```bash
# Обновить Grafana с новым datasource для Loki
helm upgrade grafana ./infra/helmcharts/grafana \
  --namespace monitoring
```

### 5. Передеплоить микросервисы

После установки зависимостей и пересборки, передеплойте сервисы через ваш CI/CD pipeline или вручную.

## Проверка работы

### 1. Проверить статус Loki

```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki
kubectl logs -n monitoring -l app.kubernetes.io/name=loki
```

### 2. Проверить логи микросервисов

При запуске сервисов должны появиться сообщения:
```
OpenTelemetry SDK started for backend service
Logs exporter endpoint: http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs
```

### 3. Проверить в Grafana

1. Открыть Grafana
2. Перейти в Explore
3. Выбрать datasource "Loki"
4. Выполнить запрос:
```logql
{service_name="backend"}
```

## Примеры LogQL запросов

```logql
# Все логи от backend
{service_name="backend"}

# Все логи от frontend
{service_name="frontend"}

# Только ошибки
{service_name="backend"} |= "error"

# Логи с определенным уровнем
{service_name="backend", level="error"}

# Поиск по тексту
{service_name="backend"} |= "user login"

# JSON parsing
{service_name="backend"} | json | level="error"

# Частота ошибок
rate({service_name="backend"} |= "error" [1m])
```

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                      │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Backend    │         │   Frontend   │                 │
│  │  (NestJS)    │         │  (Next.js)   │                 │
│  │              │         │              │                 │
│  │  OTLP Logs   │         │  OTLP Logs   │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         │  HTTP POST             │  HTTP POST               │
│         │  /otlp/v1/logs         │  /otlp/v1/logs          │
│         │                        │                          │
│         └────────────┬───────────┘                          │
│                      │                                      │
│                      ▼                                      │
│         ┌────────────────────────┐                         │
│         │    Loki Gateway        │                         │
│         │  (Load Balancer)       │                         │
│         └────────────┬───────────┘                         │
│                      │                                      │
│                      ▼                                      │
│         ┌────────────────────────┐                         │
│         │  Loki SingleBinary     │                         │
│         │  - Ingester            │                         │
│         │  - Querier             │                         │
│         │  - Distributor         │                         │
│         └────────────┬───────────┘                         │
│                      │                                      │
│                      ▼                                      │
│         ┌────────────────────────┐                         │
│         │  Persistent Volume     │                         │
│         │  (Filesystem Storage)  │                         │
│         │  10Gi, 31 days         │                         │
│         └────────────────────────┘                         │
│                      ▲                                      │
│                      │                                      │
│                      │  LogQL Queries                       │
│                      │                                      │
│         ┌────────────┴───────────┐                         │
│         │      Grafana           │                         │
│         │  - Explore             │                         │
│         │  - Dashboards          │                         │
│         │  - Alerts              │                         │
│         └────────────────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Особенности реализации

### 1. Автоматическая отправка логов

Логи автоматически отправляются в Loki через OpenTelemetry SDK. Все console.log, console.error и другие логи будут перехвачены и отправлены.

### 2. Структурированные логи

OpenTelemetry автоматически добавляет метаданные к логам:
- `service_name` - имя сервиса (backend/frontend)
- `timestamp` - время создания лога
- `level` - уровень логирования
- `trace_id` - ID трейса (если доступен)
- `span_id` - ID спана (если доступен)

### 3. Корреляция с метриками

Через derived fields в Grafana можно переходить от логов к метрикам и обратно.

### 4. Batch processing

Логи отправляются батчами для оптимизации производительности и снижения нагрузки на сеть.

### 5. Graceful shutdown

При завершении работы сервиса все накопленные логи будут отправлены перед выключением.

## Мониторинг и алерты

Loki экспортирует метрики в Prometheus формате, которые автоматически собираются VictoriaMetrics:

- `loki_ingester_bytes_received_total` - объем полученных данных
- `loki_distributor_lines_received_total` - количество полученных строк логов
- `loki_request_duration_seconds` - производительность запросов

Можно настроить алерты на основе этих метрик.

## Troubleshooting

Подробное руководство по устранению проблем находится в файле:
`infra/helmcharts/loki/DEPLOY.md`

## Дополнительные материалы

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
- [OpenTelemetry Logs](https://opentelemetry.io/docs/specs/otel/logs/)

