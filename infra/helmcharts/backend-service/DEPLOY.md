# Инструкция по деплою сервисов

## Быстрый старт

### Деплой backend

```bash
helm upgrade --install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=${CI_COMMIT_SHA} \
  --namespace production
```

### Деплой backend2

```bash
helm upgrade --install backend2 ./infra/helmcharts/backend-service \
  -f services/backend2/service.yaml \
  --set image.tag=${CI_COMMIT_SHA} \
  --namespace production
```

## Использование в CD Pipeline

В вашем CI/CD pipeline используйте следующие команды:

### Для backend

```bash
helm upgrade --install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=${CI_COMMIT_SHA} \
  --namespace ${NAMESPACE} \
  --create-namespace
```

### Для backend2

```bash
helm upgrade --install backend2 ./infra/helmcharts/backend-service \
  -f services/backend2/service.yaml \
  --set image.tag=${CI_COMMIT_SHA} \
  --namespace ${NAMESPACE} \
  --create-namespace
```

## Локальная разработка

Для локального тестирования:

```bash
# Деплой backend
helm install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=latest \
  --namespace default \
  --create-namespace

# Деплой backend2
helm install backend2 ./infra/helmcharts/backend-service \
  -f services/backend2/service.yaml \
  --set image.tag=latest \
  --namespace default \
  --create-namespace
```

## Обновление существующего релиза

```bash
helm upgrade backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=v2.0.0 \
  --namespace production
```

## Удаление релиза

```bash
helm uninstall backend --namespace production
helm uninstall backend2 --namespace production
```

## Проверка статуса

```bash
# Проверить статус релиза
helm status backend --namespace production

# Посмотреть все релизы
helm list --namespace production

# Посмотреть значения, которые будут применены
helm template backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=v1.0.0
```

## Важные замечания

1. **image.tag обязателен**: Всегда передавайте `image.tag` через `--set`, так как он не хранится в service.yaml
2. **Разные HPA настройки**: Каждый сервис имеет свои настройки HPA в своем `service.yaml`
3. **Именование**: Используйте `nameOverride` и `fullnameOverride` в `service.yaml` для правильного именования ресурсов
