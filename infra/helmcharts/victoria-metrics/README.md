# Victoria Metrics Helm Chart

Victoria Metrics для сбора и хранения метрик от сервисов.

## Установка

### Добавить Helm репозиторий

```bash
helm repo add vm https://victoriametrics.github.io/helm-charts/
helm repo update
```

### Установить Victoria Metrics

```bash
# Development
helm install victoria-metrics ./infra/helmcharts/victoria-metrics \
  --namespace monitoring \
  --create-namespace

# Production
helm install victoria-metrics ./infra/helmcharts/victoria-metrics \
  --namespace monitoring \
  --create-namespace \
  -f ./infra/helmcharts/victoria-metrics/values-production.yaml
```

## Обновление

```bash
helm dependency update ./infra/helmcharts/victoria-metrics

helm upgrade victoria-metrics ./infra/helmcharts/victoria-metrics \
  --namespace monitoring
```

## Доступ к Victoria Metrics

### Port-forward для локального доступа

```bash
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428
```

Затем открыть: http://localhost:8428

### Проверка метрик

```bash
# Список всех метрик
curl http://localhost:8428/api/v1/label/__name__/values

# Запрос метрик
curl 'http://localhost:8428/api/v1/query?query=http_server_duration_count'
```

## Конфигурация

### Основные параметры

- **retentionPeriod**: `30d` - период хранения метрик
- **persistentVolume.size**: `30Gi` - размер диска для хранения
- **scrape_interval**: `15s` - интервал сбора метрик

### Scraping сервисов

Victoria Metrics автоматически обнаруживает pods с label `app=backend` или `app=frontend` и собирает метрики с порта 9464.

## Troubleshooting

### Проверить что Victoria Metrics работает

```bash
kubectl get pods -n monitoring
kubectl logs -n monitoring -l app.kubernetes.io/name=victoria-metrics-single
```

### Проверить targets

```bash
# Port-forward
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428

# Открыть в браузере
open http://localhost:8428/targets
```

### Проверить что метрики собираются

```bash
curl 'http://localhost:8428/api/v1/query?query=up'
```

## Удаление

```bash
helm uninstall victoria-metrics --namespace monitoring
kubectl delete namespace monitoring
```

