# Мониторинг

Система мониторинга основана на трёх компонентах: OpenTelemetry (инструментация), Victoria Metrics (хранение метрик), Grafana (визуализация). Логи отдельно уходят в Loki.

## Архитектура

```
Сервис (порт 9464 /metrics)
        │
        ▼
Victoria Metrics ──scrape──▶ хранение 30d (20Gi)
        │
        ▼
   Grafana (dashboards, alerts)

Сервис ──OTLP──▶ Loki Gateway ──▶ Loki ──▶ Grafana
```

Victoria Metrics работает в режиме **single-server**, namespace `monitoring`. Scrape по аннотации `prometheus.io/scrape: "true"` на подах в namespace `default`.

---

## Инструментация сервисов

Пакет: `packages/instrumentation` — единый для всех типов сервисов.

### Next.js

Файл `instrumentation.nodejs.ts` в корне сервиса:

```ts
process.env.OTEL_SEMCONV_STABILITY_OPT_IN = "http/dup";
// Должно быть ДО любых импортов — иначе HTTP instrumentation
// инициализируется без новых semantic conventions и http.route не пишется в метрики

import { createNextInstrumentationConfig } from "@supreme-int/instrumentation/...";
import { createMetricViews } from "@supreme-int/instrumentation/...";
```

`OTEL_SEMCONV_STABILITY_OPT_IN=http/dup` заставляет `@opentelemetry/instrumentation-http` эмитировать оба набора атрибутов (старые + новые). Без этого метрика `http.server.duration` не содержит `http.route`.

**Что записывается:**

- Кастомная метрика `http.server.duration` (unit: `ms`) — histogram с атрибутами `http.route`, `http.method`, `http.status_code`
- Нормализация роута в `requestHook`: числа → `:id`, UUID → `:uuid`, `/_next/*` → `/_next/*`

**Views** (`createMetricViews`): добавляют `http.route` к авто-инструментированным метрикам `http.server.duration` и `http.server.request.duration` от `@opentelemetry/instrumentation-http`.

### NestJS

Файл `src/instrumentation.ts`:

```ts
import { createNestInstrumentationConfig } from "@supreme-int/instrumentation/...";
```

`requestHook` читает `req.routeOptions.url` (Fastify) и пишет его в `http.route` на спане. Также настроен `@opentelemetry/instrumentation-fastify`.

### FastAPI (Python)

Пакет `authorization-py` / `instrumentation.py`. Использует `opentelemetry-instrumentation-fastapi`.

**Важное отличие от Node.js:** Python Prometheus exporter добавляет суффикс `_milliseconds` к unit `ms`, поэтому метрика называется `http_server_duration_milliseconds` (а не `http_server_duration`). Лейбл пути — `http_target` (а не `http_route`).

### Сравнение по типам сервисов

|               | Next.js / NestJS       | FastAPI                             |
| ------------- | ---------------------- | ----------------------------------- |
| Метрика       | `http_server_duration` | `http_server_duration_milliseconds` |
| Лейбл пути    | `http_route`           | `http_target`                       |
| Значение пути | нормализованный route  | реальный URL target                 |

### Экспорт метрик

Каждый сервис слушает порт `9464`, endpoint `/metrics` — стандартный Prometheus exposition format.

Переменные окружения (проставляются через Helm overrides):

```
LOKI_ENDPOINT=http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs
```

Prometheus port/endpoint захардкожены в `packages/instrumentation/src/shared/config/constants.ts`.

---

## Victoria Metrics

**Конфиг:** `infra/helmcharts/victoria-metrics/values.yaml`

- `retentionPeriod: 30d`
- Storage: `20Gi`
- Scrape interval: `15s`, timeout `10s`
- ClusterIP, порт `8428`

**Service discovery:** Kubernetes pod SD, namespace `default`. Условие скрейпа — аннотация `prometheus.io/scrape: "true"` и наличие порта с именем `metrics`.

Лейблы, добавляемые при scrape через `relabel_configs`:

- `service` ← `app.kubernetes.io/name` (имя сервиса)
- `pod` ← имя пода
- `namespace`, `container`, `node`

Все запросы в Grafana используют datasource `VictoriaMetrics` (UID: `VictoriaMetrics`).

---

## Grafana

**Конфиг:** `infra/helmcharts/grafana/values.yaml`

- LoadBalancer на порт 80 (targetPort 3000)
- Persistence: `5Gi`
- Refresh: `10s` (в дашбордах)

**Datasources (настроены автоматически при деплое):**

- `VictoriaMetrics` — `http://victoria-metrics-victoria-metrics-single-server.monitoring.svc.cluster.local:8428`, default, httpMethod POST
- `Loki` — `http://loki.monitoring.svc.cluster.local:3100`, derived field TraceID → VictoriaMetrics

**Загрузка дашбордов:** через Grafana sidecar. Дашборды живут в ConfigMap с лейблом `grafana_dashboard=1`, sidecar ищет такие ConfigMap во всех namespace.

---

## Grafana дашборды

### Расположение и структура

Каждый сервис имеет свой дашборд: `infra/helmcharts/grafana/dashboards/{serviceName}-metrics.json`.

**Дашборды не редактируются вручную** — они генерируются командой:

```bash
pnpm run generate:router
```

Генератор: `infra/generate/generate-router/generate-grafana-dashboard.ts`

### Секции дашборда

Каждый дашборд состоит из фиксированных секций:

| Секция                          | Содержимое                                                      |
| ------------------------------- | --------------------------------------------------------------- |
| **Main**                        | Общие Timings (P80/P95/P99), OR RPS, Bad RPS — без статус-чеков |
| **By POD**                      | Те же метрики с разбивкой по поду                               |
| **Node JS / Python Runtime**    | Event Loop / Heap / CPU / Memory                                |
| **Status Checks** _(collapsed)_ | OR RPS и Bad RPS только для liveness/readiness probe запросов   |
| **Routes Metrics**              | Для каждого роута из router.yaml: Timings + OK RPS + Bad RPS    |

Секции Main, By POD и Node JS/Python Runtime **сохраняются при регенерации** как есть (генератор их не трогает, только обновляет PromQL). Секции Status Checks и Routes Metrics **полностью пересоздаются** при каждой регенерации.

### PromQL — ключевые паттерны

**Корректная формула для перцентилей:**

```promql
histogram_quantile(0.95,
  sum(rate(http_server_duration_bucket{service="web-auth-ssr",http_route!="/api/status"}[5m]))
  by (le)
)
```

> ⚠️ Неверный вариант: `sum(histogram_quantile(0.95, rate(...)))` — суммирует готовые перцентили, что математически некорректно и даёт завышенные значения.

**By-pod вариант** — добавить `pod` в `by`:

```promql
histogram_quantile(0.95,
  sum(rate(http_server_duration_bucket{service="..."}[5m]))
  by (le, pod)
)
```

**OR RPS (без статус-чеков):**

```promql
sum(rate(http_server_duration_count{
  service="web-auth-ssr",
  http_status_code=~"2..|3..",
  http_route!="/api/status"
}[1m])) by (http_status_code)
```

**Для FastAPI** — то же самое, но `http_server_duration_milliseconds` и `http_target`:

```promql
histogram_quantile(0.95,
  sum(rate(http_server_duration_milliseconds_bucket{
    service="core-auth",
    http_target!="/core-auth/status"
  }[5m]))
  by (le)
)
```

### Фильтрация статус-чеков

K8s liveness/readiness probes стреляют каждые 20 секунд и загрязняют общие RPS-метрики. В секции Main и By POD они исключены через точный фильтр по пути. Путь берётся из `infra/overrides/production/{serviceName}.yaml` → `livenessProbe.httpGet.path`.

Конкретные пути по сервисам:

| Сервис                                               | Путь статус-чека               | Лейбл         |
| ---------------------------------------------------- | ------------------------------ | ------------- |
| Next.js сервисы                                      | `/api/status`                  | `http_route`  |
| `core-recipes-bff`                                   | `/core-recipes-bff/api/status` | `http_route`  |
| `core-auth`, `core-applications`, `core-client-info` | `/{service}/status`            | `http_target` |
| `core-schedule`                                      | `/core-schedule/api/status`    | `http_target` |

Используется точное равенство (`!=`), не regex — чтобы не задеть реальные endpoint'ы с `status` в пути.

### Генератор дашбордов

`generate-grafana-dashboard.ts` вызывается для каждого сервиса в `generate-router/index.ts`:

1. Читает `services/{name}/router.yaml` → получает тип сервиса и список роутов
2. Читает `infra/overrides/production/{name}.yaml` → получает точный путь статус-чека
3. Группирует существующие панели дашборда по секциям (main/bypod/nodejs — сохраняет; routes/status_checks — выбрасывает)
4. Обновляет PromQL в main/bypod панелях: фиксирует формулу histogram_quantile + добавляет фильтр исключения статус-чека
5. Генерирует collapsed row **Status Checks** (2 панели: OK RPS + Bad RPS только для probe-трафика)
6. Генерирует row **Routes Metrics** с 3 панелями на каждый роут (Timings + OK RPS + Bad RPS)
7. Сохраняет JSON

Статические пути (`/.*`, `/_next/`, `/__nextjs`, `/static/`) в роутах — пропускаются.

---

## Деплой Grafana (CI/CD)

**Workflow:** `.github/workflows/deploy-grafana.yml` — ручной (`workflow_dispatch`).

Шаги:

1. Создаёт/обновляет namespace `monitoring`
2. Для каждого JSON-дашборда создаёт отдельный ConfigMap `grafana-dashboards-{name}` с лейблом `grafana_dashboard=1`
3. Деплоит Grafana через Helm: `helm upgrade grafana ./infra/helmcharts/grafana --namespace monitoring --install`

**Создание ConfigMap (с retry × 3):**

```bash
# Разбито на два шага через tmpfile — избегаем buffer overflow при 3-way pipe
# для больших дашбордов (core-schedule: ~285KB)
kubectl create configmap "$name" --from-file="$dashboard" \
  --namespace monitoring --dry-run=client -o yaml > "$TMPFILE"
kubectl label --local -f "$TMPFILE" grafana_dashboard=1 -o yaml | kubectl apply -f -
```

При неудаче — пауза 10s, обновление kubeconfig через `yc managed-kubernetes cluster get-credentials`.

---

## Шаблоны для новых сервисов

При генерации нового сервиса (`pnpm run generate:service`) создаётся начальный дашборд из шаблона:

| Тип     | Шаблон                                                                                |
| ------- | ------------------------------------------------------------------------------------- |
| Next.js | `infra/generate/generate-service/templates/common/next/grafana-dashboard.json.hbs`    |
| NestJS  | `infra/generate/generate-service/templates/common/nest/grafana-dashboard.json.hbs`    |
| FastAPI | `infra/generate/generate-service/templates/common/fastapi/grafana-dashboard.json.hbs` |

Шаблоны содержат правильные PromQL-формулы. После создания сервиса нужно запустить `pnpm run generate:router` — он обновит Routes Metrics секцию по реальным роутам.

---

## Troubleshooting

### Метрики не появляются в Victoria Metrics

```bash
# Проверить что pod имеет аннотацию и порт metrics
kubectl get pod -l app.kubernetes.io/name=<service> -o yaml | grep -A5 annotations
kubectl get pod -l app.kubernetes.io/name=<service> -o yaml | grep -A3 ports

# Проверить targets
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428
open http://localhost:8428/targets
```

### Grafana не загружает дашборд

```bash
# Проверить что ConfigMap есть с правильным лейблом
kubectl get configmap -n monitoring -l grafana_dashboard=1

# Проверить логи sidecar
kubectl logs -n monitoring deployment/grafana -c grafana-sc-dashboard
```

### Метрики есть, но http.route пустой (Next.js)

Убедиться что в `instrumentation.nodejs.ts`:

1. `process.env.OTEL_SEMCONV_STABILITY_OPT_IN = 'http/dup'` стоит **до** любых import
2. Передаётся `serviceName` в `createNextInstrumentationConfig(serviceName)`
3. `createMetricViews()` передаётся в SDK

### Тайминги в Main панели выглядят аномально высокими

Скорее всего старый дашборд со старой формулой `sum(histogram_quantile(...))`. Запустить регенерацию:

```bash
pnpm run generate:router
```

Затем задеплоить Grafana через workflow `deploy-grafana`.

### Статус-чеки всё ещё видны в основных панелях

Проверить что в дашборде есть фильтр исключения. В Victoria Metrics:

```promql
# Посмотреть все значения http_route для сервиса
count by (http_route) (http_server_duration_count{service="web-auth-ssr"})
```

Если probe-трафик есть, регенерировать дашборд командой выше.
