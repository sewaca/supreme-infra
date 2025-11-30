# Service Helm Chart

Универсальный Helm chart для деплоя backend сервисов (NestJS приложения) в Kubernetes.

## Архитектура

Chart универсальный и может использоваться для разных сервисов. Настройки для каждого сервиса хранятся в `services/${service_name}/service.yaml`.

## Установка

### Базовый деплой (без конфигурации сервиса)

```bash
helm install <release-name> ./infra/helmcharts/backend-service \
  --set image.repository=<repository> \
  --set image.tag=<tag>
```

### Деплой с конфигурацией из service.yaml

```bash
# Для backend
helm install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=<TAG>

# Для backend2
helm install backend2 ./infra/helmcharts/backend-service \
  -f services/backend2/service.yaml \
  --set image.tag=<TAG>
```

## Использование в CD

При деплое через CD pipeline, тег образа передается через параметр `image.tag`:

```bash
# Деплой backend
helm upgrade --install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=${CI_COMMIT_SHA} \
  --namespace production

# Деплой backend2
helm upgrade --install backend2 ./infra/helmcharts/backend-service \
  -f services/backend2/service.yaml \
  --set image.tag=${CI_COMMIT_SHA} \
  --namespace production
```

## Структура конфигурации сервиса

Каждый сервис должен иметь файл `services/${service_name}/service.yaml` с настройками:

```yaml
image:
  repository: backend  # имя образа

nameOverride: "backend"  # имя для ресурсов Kubernetes
fullnameOverride: "backend"  # полное имя (если нужно переопределить)

service:
  type: ClusterIP
  port: 80
  targetPort: 4000

env:
  PORT: "4000"
  NODE_ENV: "production"

replicaCount: 2

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

# HPA настройки (опционально)
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

## Параметры

### Основные параметры

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `replicaCount` | Количество реплик | `2` |
| `image.repository` | Репозиторий образа | `""` (обязательно указать) |
| `image.tag` | Тег образа (обязательно передавать извне) | `""` |
| `image.pullPolicy` | Политика загрузки образа | `IfNotPresent` |
| `nameOverride` | Переопределение имени | `""` |
| `fullnameOverride` | Переопределение полного имени | `""` |

### Service параметры

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `service.type` | Тип сервиса | `ClusterIP` |
| `service.port` | Порт сервиса | `80` |
| `service.targetPort` | Порт контейнера | `4000` |

### Переменные окружения

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `env.PORT` | Порт приложения | `4000` |
| `env.NODE_ENV` | Окружение | `production` |

### Ресурсы

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `resources.limits.cpu` | Лимит CPU | `500m` |
| `resources.limits.memory` | Лимит памяти | `512Mi` |
| `resources.requests.cpu` | Запрос CPU | `100m` |
| `resources.requests.memory` | Запрос памяти | `128Mi` |

### HPA (Horizontal Pod Autoscaler)

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `autoscaling.enabled` | Включить HPA | `false` |
| `autoscaling.minReplicas` | Минимальное количество реплик | `2` |
| `autoscaling.maxReplicas` | Максимальное количество реплик | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | Целевая утилизация CPU | `80` |
| `autoscaling.targetMemoryUtilizationPercentage` | Целевая утилизация памяти | `80` |
| `autoscaling.behavior` | Поведение масштабирования | См. values.yaml |

## Примеры использования

### Пример 1: Деплой backend с базовыми настройками

```bash
helm install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=v1.0.0
```

### Пример 2: Деплой backend2 с другими HPA настройками

```bash
helm install backend2 ./infra/helmcharts/backend-service \
  -f services/backend2/service.yaml \
  --set image.tag=v1.0.0
```

### Пример 3: Обновление существующего релиза

```bash
helm upgrade backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=v2.0.0
```

### Пример 4: Деплой с переопределением параметров

```bash
helm install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=v1.0.0 \
  --set replicaCount=3 \
  --set resources.limits.memory=1Gi
```

### Пример 5: Деплой без HPA (отключить авт scaling)

```bash
helm install backend ./infra/helmcharts/backend-service \
  -f services/backend/service.yaml \
  --set image.tag=v1.0.0 \
  --set autoscaling.enabled=false
```

## Различия между сервисами

Каждый сервис может иметь свои настройки HPA и ресурсов:

- **backend**: более консервативные настройки HPA (2-5 реплик, CPU 70%)
- **backend2**: более агрессивные настройки HPA (3-20 реплик, CPU 60%, быстрее масштабирование)

Все настройки хранятся в соответствующих `service.yaml` файлах.

## Health Checks

Chart включает настройки для health checks:

- **Liveness Probe**: проверяет, что приложение работает
- **Readiness Probe**: проверяет, что приложение готово принимать трафик

Настройки по умолчанию:
- Liveness: `/` endpoint, задержка 30s, период 10s
- Readiness: `/` endpoint, задержка 10s, период 5s
