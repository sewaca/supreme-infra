# Grafana Helm Chart

Grafana для визуализации метрик из Victoria Metrics.

## Установка

### Добавить Helm репозиторий

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### Установить Grafana

```bash
# Сначала создать ConfigMap с дашбордами
kubectl create configmap grafana-dashboards \
  --from-file=./infra/helmcharts/grafana/dashboards/ \
  --namespace monitoring

# Установить Grafana
helm install grafana ./infra/helmcharts/grafana \
  --namespace monitoring \
  --create-namespace
```

## Доступ к Grafana

### Получить External IP LoadBalancer

```bash
kubectl get svc -n monitoring grafana
```

Grafana будет доступна по External IP на порту 80.

### Credentials

- **Username**: `admin`
- **Password**: `admin` (рекомендуется изменить после первого входа)

### Port-forward для локального доступа

```bash
kubectl port-forward -n monitoring svc/grafana 3000:80
```

Затем открыть: http://localhost:3000

## Дашборды

После установки автоматически импортируется дашборд:

- **Backend Service Metrics** - основные метрики backend сервиса

### Панели дашборда

1. **Request Rate (RPS)** - OK и Bad RPS
2. **Response Time (Latency)** - P50, P95, P99
3. **Error Rate (5xx)** - процент ошибок сервера
4. **Status Codes Distribution** - распределение статус кодов
5. **Top 10 Endpoints by RPS** - самые популярные endpoints
6. **Top 10 Slowest Endpoints (P95)** - самые медленные endpoints
7. **Memory Usage** - использование памяти
8. **Event Loop Utilization** - загрузка event loop

## Настройка алертов

### Создать алерт для высокого error rate

1. Открыть дашборд "Backend Service Metrics"
2. Открыть панель "Error Rate (5xx)"
3. Нажать на заголовок панели → Edit
4. Перейти на вкладку "Alert"
5. Создать новый alert rule:
   - **Condition**: `WHEN last() OF query(A) IS ABOVE 0.05`
   - **For**: `5m`
   - **Annotations**: "High error rate detected"

### Создать алерт для высокой latency

1. Открыть панель "Response Time (Latency)"
2. Создать alert rule:
   - **Condition**: `WHEN last() OF query(B) IS ABOVE 1000` (P95 > 1s)
   - **For**: `5m`
   - **Annotations**: "High latency detected"

### Создать алерт для недоступности сервиса

Создать новый alert rule:
```promql
absent(up{service="backend"}) == 1
```

## Обновление дашбордов

```bash
# Обновить ConfigMap с дашбордами
kubectl create configmap grafana-dashboards \
  --from-file=./infra/helmcharts/grafana/dashboards/ \
  --namespace monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Перезапустить Grafana pod
kubectl rollout restart deployment -n monitoring grafana
```

## Обновление Grafana

```bash
helm dependency update ./infra/helmcharts/grafana

helm upgrade grafana ./infra/helmcharts/grafana \
  --namespace monitoring
```

## Troubleshooting

### Проверить что Grafana работает

```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana
```

### Проверить datasource

1. Открыть Grafana
2. Configuration → Data sources
3. Проверить что VictoriaMetrics datasource работает (зеленая галочка)

### Проверить дашборды

```bash
kubectl get configmap -n monitoring grafana-dashboards -o yaml
```

## Удаление

```bash
helm uninstall grafana --namespace monitoring
kubectl delete configmap grafana-dashboards --namespace monitoring
```

