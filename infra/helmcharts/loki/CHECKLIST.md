# Loki Deployment Checklist

## Pre-deployment

- [ ] Kubernetes cluster доступен
- [ ] kubectl настроен и работает
- [ ] Helm 3.x установлен
- [ ] Namespace `monitoring` создан (или будет создан автоматически)
- [ ] Доступен storage class для PersistentVolumes

## Installation Steps

### 1. Dependencies
- [ ] Выполнено `pnpm install` в корне проекта
- [ ] Проверено, что новые пакеты установлены:
  - `@opentelemetry/sdk-logs`
  - `@opentelemetry/exporter-logs-otlp-http`
  - `@opentelemetry/api-logs`

### 2. Helm Repository
- [ ] Добавлен Grafana Helm репозиторий: `helm repo add grafana https://grafana.github.io/helm-charts`
- [ ] Обновлен репозиторий: `helm repo update`

### 3. Loki Installation
- [ ] Установлен Loki: `helm install loki ./infra/helmcharts/loki -n monitoring --create-namespace`
- [ ] Проверен статус: `kubectl get pods -n monitoring -l app.kubernetes.io/name=loki`
- [ ] Проверены логи: `kubectl logs -n monitoring -l app.kubernetes.io/name=loki`

### 4. Grafana Update
- [ ] Обновлена Grafana: `helm upgrade grafana ./infra/helmcharts/grafana -n monitoring`
- [ ] Проверен статус: `kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana`

### 5. Services Rebuild
- [ ] Пересобран backend: `cd services/backend && pnpm run build`
- [ ] Пересобран frontend: `cd services/frontend && pnpm run build`
- [ ] Проверены ошибки компиляции

### 6. Services Deployment
- [ ] Передеплоен backend сервис
- [ ] Передеплоен frontend сервис
- [ ] Проверены логи сервисов на наличие сообщения: "Logs exporter endpoint: ..."

## Post-deployment Verification

### 1. Loki Health
- [ ] Loki pods в статусе Running
- [ ] Loki gateway доступен: `kubectl get svc -n monitoring loki-gateway`
- [ ] Endpoint `/ready` отвечает: `kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n monitoring -- curl http://loki-gateway/ready`

### 2. Services Health
- [ ] Backend pods в статусе Running
- [ ] Frontend pods в статусе Running
- [ ] В логах сервисов нет ошибок OTLP
- [ ] Переменная окружения LOKI_ENDPOINT установлена

### 3. Grafana Integration
- [ ] Grafana доступна
- [ ] Datasource "Loki" настроен
- [ ] Test datasource успешен (зеленая галочка)
- [ ] В Explore можно выбрать Loki

### 4. Logs Flow
- [ ] В Grafana Explore выполнен запрос: `{service_name="backend"}`
- [ ] Логи отображаются
- [ ] В Grafana Explore выполнен запрос: `{service_name="frontend"}`
- [ ] Логи отображаются
- [ ] Timestamp логов корректный

### 5. Performance
- [ ] Loki не показывает ошибки ingestion rate
- [ ] CPU и Memory usage в пределах нормы
- [ ] PersistentVolume создан и используется
- [ ] Нет ошибок в логах Loki

## Optional Enhancements

- [ ] Создан dashboard для логов в Grafana
- [ ] Настроены алерты на основе логов
- [ ] Настроен log sampling (если большой объем логов)
- [ ] Увеличен retention period (если нужно хранить дольше 31 дня)
- [ ] Настроен backup для PersistentVolume

## Rollback Plan

Если что-то пошло не так:

1. Откатить сервисы:
```bash
# Вернуть предыдущую версию деплоймента
kubectl rollout undo deployment/<service-name> -n <namespace>
```

2. Удалить Loki (опционально):
```bash
helm uninstall loki -n monitoring
```

3. Откатить Grafana (опционально):
```bash
helm rollout undo grafana -n monitoring
```

4. Откатить изменения в коде:
```bash
git revert <commit-hash>
```

## Common Issues

### Issue: Loki pod не запускается
**Solution**: Проверить наличие storage class и права на создание PVC

### Issue: Логи не появляются в Grafana
**Solution**: 
1. Проверить connectivity между сервисами и Loki
2. Проверить LOKI_ENDPOINT в env переменных
3. Проверить логи сервисов на ошибки OTLP

### Issue: Ошибки ingestion rate
**Solution**: Увеличить лимиты в values.yaml:
```yaml
loki:
  loki:
    limits_config:
      ingestion_rate_mb: 20
      ingestion_burst_size_mb: 40
```

### Issue: Недостаточно места на диске
**Solution**: Увеличить размер PVC:
```yaml
loki:
  singleBinary:
    persistence:
      size: 20Gi
```

## Support

- Документация: `DEPLOY.md`, `README.md`, `QUICK_START.md`
- Общая информация: `/LOKI_SETUP.md` в корне проекта
- Официальная документация: https://grafana.com/docs/loki/latest/

