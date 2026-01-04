# Loki Quick Start Guide

## Быстрая установка

```bash
# 1. Установить зависимости
pnpm install

# 2. Добавить Grafana Helm репозиторий
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# 3. Установить Loki
helm install loki ./infra/helmcharts/loki -n monitoring --create-namespace

# 4. Обновить Grafana
helm upgrade grafana ./infra/helmcharts/grafana -n monitoring

# 5. Пересобрать и передеплоить сервисы
cd services/backend && pnpm run build
cd services/frontend && pnpm run build
# Затем передеплоить через CI/CD
```

## Быстрая проверка

```bash
# Проверить статус Loki
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki

# Проверить логи Loki
kubectl logs -n monitoring -l app.kubernetes.io/name=loki --tail=50

# Port-forward к Grafana
kubectl port-forward -n monitoring svc/grafana 3000:80

# Открыть http://localhost:3000
# Перейти в Explore → выбрать Loki → запрос: {service_name="backend"}
```

## Полезные команды

### Просмотр логов

```bash
# Port-forward к Loki
kubectl port-forward -n monitoring svc/loki-gateway 3100:80

# Получить последние логи
curl -G -s "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={service_name="backend"}' \
  --data-urlencode 'limit=10' | jq

# Получить логи за период
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={service_name="backend"}' \
  --data-urlencode 'start=2024-01-01T00:00:00Z' \
  --data-urlencode 'end=2024-01-02T00:00:00Z' | jq
```

### Управление

```bash
# Обновить конфигурацию
helm upgrade loki ./infra/helmcharts/loki -n monitoring

# Перезапустить Loki
kubectl rollout restart deployment/loki -n monitoring

# Удалить Loki
helm uninstall loki -n monitoring
```

## Популярные LogQL запросы

```logql
# Все логи от сервиса
{service_name="backend"}

# Ошибки
{service_name="backend"} |= "error"

# Логи за последние 5 минут
{service_name="backend"} [5m]

# Частота логов
rate({service_name="backend"}[1m])

# Фильтр по уровню (если используется structured logging)
{service_name="backend"} | json | level="error"

# Поиск по тексту
{service_name="backend"} |~ "user.*login"

# Исключить определенные логи
{service_name="backend"} != "health check"
```

## Troubleshooting

### Логи не появляются в Grafana

1. Проверить, что Loki работает:
```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki
```

2. Проверить логи сервисов на наличие ошибок OTLP:
```bash
kubectl logs -n <namespace> <pod-name> | grep -i loki
```

3. Проверить connectivity:
```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n monitoring -- \
  curl http://loki-gateway/ready
```

### Ошибки ingestion rate

Если видите ошибки о превышении лимитов, увеличьте в `values.yaml`:
```yaml
loki:
  loki:
    limits_config:
      ingestion_rate_mb: 20
      ingestion_burst_size_mb: 40
```

### Недостаточно места

```bash
# Проверить использование
kubectl exec -n monitoring <loki-pod> -- df -h

# Увеличить размер PVC в values.yaml
loki:
  singleBinary:
    persistence:
      size: 20Gi
```

## Дополнительная документация

- Полное руководство: `DEPLOY.md`
- Общая информация: `/LOKI_SETUP.md`

