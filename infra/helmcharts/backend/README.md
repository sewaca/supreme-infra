# Backend Helm Chart

Helm chart для деплоя NestJS backend приложения в Kubernetes.

## Установка

```bash
helm install backend ./infra/helmcharts/backend --set image.tag=<TAG>
```

## Использование в CD

При деплое через CD pipeline, тег образа передается через параметр `image.tag`:

```bash
helm upgrade --install backend ./infra/helmcharts/backend \
  --set image.tag=${CI_COMMIT_SHA} \
  --namespace production
```

## Параметры

Основные параметры, которые можно переопределить:

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `replicaCount` | Количество реплик | `2` |
| `image.repository` | Репозиторий образа | `backend` |
| `image.tag` | Тег образа (обязательно передавать извне) | `""` |
| `image.pullPolicy` | Политика загрузки образа | `IfNotPresent` |
| `service.type` | Тип сервиса | `ClusterIP` |
| `service.port` | Порт сервиса | `80` |
| `service.targetPort` | Порт контейнера | `4000` |
| `env.PORT` | Порт приложения | `4000` |
| `env.NODE_ENV` | Окружение | `production` |
| `resources.limits.cpu` | Лимит CPU | `500m` |
| `resources.limits.memory` | Лимит памяти | `512Mi` |
| `resources.requests.cpu` | Запрос CPU | `100m` |
| `resources.requests.memory` | Запрос памяти | `128Mi` |

## Примеры

### Базовый деплой

```bash
helm install backend ./infra/helmcharts/backend --set image.tag=v1.0.0
```

### С кастомными ресурсами

```bash
helm install backend ./infra/helmcharts/backend \
  --set image.tag=v1.0.0 \
  --set resources.limits.memory=1Gi \
  --set resources.requests.memory=256Mi
```

### С дополнительными переменными окружения

```bash
helm install backend ./infra/helmcharts/backend \
  --set image.tag=v1.0.0 \
  --set env.DATABASE_URL=postgresql://localhost/db
```

