# Monitoring Setup Guide

Руководство по развертыванию системы мониторинга с Victoria Metrics и Grafana.

## Архитектура

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Backend   │────▶│ Victoria Metrics │────▶│   Grafana   │
│  (port 9464)│     │   (scraping)     │     │ (dashboards)│
└─────────────┘     └──────────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Persistent  │
                    │   Storage    │
                    │   (30 days)  │
                    └──────────────┘
```

## Компоненты

1. **OpenTelemetry** - инструментация backend сервиса
2. **Victoria Metrics** - сбор и хранение метрик
3. **Grafana** - визуализация и алерты

## Шаг 1: Развертывание Victoria Metrics

### 1.1 Добавить Helm репозиторий

```bash
helm repo add vm https://victoriametrics.github.io/helm-charts/
helm repo update
```

### 1.2 Обновить зависимости

```bash
cd infra/helmcharts/victoria-metrics
helm dependency update
```

### 1.3 Установить Victoria Metrics

```bash
helm install victoria-metrics ./infra/helmcharts/victoria-metrics \
  --namespace monitoring \
  --create-namespace
```

### 1.4 Проверить установку

```bash
# Проверить pods
kubectl get pods -n monitoring

# Проверить что Victoria Metrics работает
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428

# Открыть в браузере
open http://localhost:8428
```

## Шаг 2: Развертывание Grafana

### 2.1 Добавить Helm репозиторий

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 2.2 Обновить зависимости

```bash
cd infra/helmcharts/grafana
helm dependency update
```

### 2.3 Создать ConfigMap с дашбордами

```bash
kubectl create configmap grafana-dashboards \
  --from-file=./infra/helmcharts/grafana/dashboards/ \
  --namespace monitoring
```

### 2.4 Установить Grafana

```bash
helm install grafana ./infra/helmcharts/grafana \
  --namespace monitoring
```

### 2.5 Получить External IP LoadBalancer

```bash
kubectl get svc -n monitoring grafana

# Дождаться пока появится EXTERNAL-IP
# Grafana будет доступна по http://<EXTERNAL-IP>
```

### 2.6 Войти в Grafana

- **URL**: `http://<EXTERNAL-IP>`
- **Username**: `admin`
- **Password**: `admin`

**Важно**: Измените пароль после первого входа!

## Шаг 3: Развертывание Backend с метриками

### 3.1 Собрать Docker образ

```bash
cd services/backend
docker build -t <your-registry>/backend:latest .
docker push <your-registry>/backend:latest
```

### 3.2 Установить backend

```bash
helm install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.repository=<your-registry>/backend \
  --set image.tag=latest \
  --namespace default
```

### 3.3 Проверить что метрики собираются

```bash
# Port-forward к backend
kubectl port-forward svc/backend 9464:9464

# Проверить метрики
curl http://localhost:9464/metrics
```

### 3.4 Проверить что Victoria Metrics видит backend

```bash
# Port-forward к Victoria Metrics
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428

# Проверить targets
open http://localhost:8428/targets

# Должен быть target с job="backend"
```

## Шаг 4: Проверка дашбордов в Grafana

1. Открыть Grafana: `http://<EXTERNAL-IP>`
2. Войти (admin/admin)
3. Перейти в Dashboards → Browse
4. Открыть "Backend Service Metrics"
5. Проверить что данные отображаются

## Метрики

### HTTP метрики

- **http_server_duration_count** - количество запросов
- **http_server_duration_sum** - суммарное время запросов
- **http_server_duration_bucket** - histogram buckets для latency

### Node.js метрики

- **nodejs_eventloop_utilization** - загрузка event loop
- **v8js_memory_heap_used** - использование памяти
- **v8js_gc_duration** - время garbage collection

### Примеры запросов

```promql
# OK RPS
rate(http_server_duration_count{service="backend", http_status_code=~"2.."}[1m])

# Bad RPS
rate(http_server_duration_count{service="backend", http_status_code=~"[45].."}[1m])

# P95 Latency
histogram_quantile(0.95, rate(http_server_duration_bucket{service="backend"}[5m]))

# Error Rate
rate(http_server_duration_count{service="backend", http_status_code=~"5.."}[1m]) 
/ 
rate(http_server_duration_count{service="backend"}[1m])
```

## Настройка алертов

### В Grafana

1. Перейти в Alerting → Alert rules
2. Создать новый alert rule
3. Выбрать datasource: VictoriaMetrics
4. Настроить условие, например:

**High Error Rate:**
```promql
rate(http_server_duration_count{service="backend", http_status_code=~"5.."}[5m]) 
/ 
rate(http_server_duration_count{service="backend"}[5m]) > 0.05
```

**High Latency:**
```promql
histogram_quantile(0.95, rate(http_server_duration_bucket{service="backend"}[5m])) > 1000
```

**Service Down:**
```promql
absent(up{service="backend"}) == 1
```

## Обновление

### Обновить Victoria Metrics

```bash
helm upgrade victoria-metrics ./infra/helmcharts/victoria-metrics \
  --namespace monitoring
```

### Обновить Grafana

```bash
# Обновить дашборды
kubectl create configmap grafana-dashboards \
  --from-file=./infra/helmcharts/grafana/dashboards/ \
  --namespace monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

# Обновить Grafana
helm upgrade grafana ./infra/helmcharts/grafana \
  --namespace monitoring

# Перезапустить pods
kubectl rollout restart deployment -n monitoring grafana
```

### Обновить Backend

```bash
# Собрать новый образ
docker build -t <your-registry>/backend:v2 .
docker push <your-registry>/backend:v2

# Обновить deployment
helm upgrade backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=v2 \
  --namespace default
```

## Troubleshooting

### Victoria Metrics не собирает метрики

1. Проверить что backend pod имеет annotations:
```bash
kubectl get pod -l app=backend -o yaml | grep -A 3 annotations
```

2. Проверить targets в Victoria Metrics:
```bash
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428
open http://localhost:8428/targets
```

3. Проверить логи Victoria Metrics:
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=victoria-metrics-single
```

### Grafana не показывает данные

1. Проверить datasource:
   - Grafana → Configuration → Data sources
   - Проверить URL: `http://victoria-metrics-victoria-metrics-single-server.monitoring.svc.cluster.local:8428`
   - Нажать "Test" - должно быть "Data source is working"

2. Проверить что метрики есть в Victoria Metrics:
```bash
curl 'http://localhost:8428/api/v1/query?query=up{service="backend"}'
```

### Backend не экспортирует метрики

1. Проверить что порт 9464 открыт:
```bash
kubectl port-forward svc/backend 9464:9464
curl http://localhost:9464/metrics
```

2. Проверить логи backend:
```bash
kubectl logs -l app=backend
```

## Удаление

```bash
# Удалить backend
helm uninstall backend --namespace default

# Удалить Grafana
helm uninstall grafana --namespace monitoring
kubectl delete configmap grafana-dashboards --namespace monitoring

# Удалить Victoria Metrics
helm uninstall victoria-metrics --namespace monitoring

# Удалить namespace
kubectl delete namespace monitoring
```

## Retention и Storage

- **Retention период**: 30 дней
- **Storage size**: 30Gi для Victoria Metrics, 10Gi для Grafana
- **Backup**: рекомендуется настроить backup PersistentVolumes

## Безопасность

1. **Изменить пароль Grafana** после первого входа
2. **Настроить RBAC** для доступа к метрикам
3. **Включить TLS** для Grafana (через Ingress)
4. **Ограничить доступ** к Victoria Metrics (только из namespace monitoring)

## Масштабирование

Для production рекомендуется использовать Victoria Metrics Cluster:

```bash
helm install victoria-metrics vm/victoria-metrics-cluster \
  --namespace monitoring \
  --set vmselect.replicaCount=2 \
  --set vminsert.replicaCount=2 \
  --set vmstorage.replicaCount=2
```

