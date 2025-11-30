# Values Generator

Генератор полных values файлов для Helm чартов на основе service.yaml конфигураций.

## Описание

Этот генератор автоматически создает полноценные values файлы для каждого сервиса и окружения, объединяя:
- Базовые значения по умолчанию из `defaults.yaml`
- Настройки типа сервиса (backend/frontend)
- Настройки из `services/${service_name}/service.yaml`
- Переопределения для окружений из `environment-overrides.yaml`
- Специфичные для сервиса переопределения окружений (секция `overrides` в service.yaml)

## Структура

```
infra/
├── generate-values/
│   ├── index.ts                      # Точка входа
│   ├── generate-values.ts            # Основная логика генерации
│   ├── types.ts                      # TypeScript типы
│   ├── defaults.yaml                 # Базовые значения по умолчанию
│   ├── environment-overrides.yaml    # Переопределения для окружений
│   ├── templates/
│   │   └── values.hbs                # Handlebars шаблон для генерации
│   └── README.md                     # Эта документация
├── overrides/
│   ├── development/
│   │   ├── backend.yaml
│   │   └── frontend.yaml
│   ├── staging/
│   │   ├── backend.yaml
│   │   └── frontend.yaml
│   └── production/
│       ├── backend.yaml
│       └── frontend.yaml
```

## Использование

### Генерация всех values файлов

```bash
pnpm run generate:overrides
```

Эта команда:
1. Читает список сервисов из `infra/generate-service/services.json`
2. Загружает базовые значения из `defaults.yaml`
3. Загружает переопределения окружений из `environment-overrides.yaml`
4. Для каждого сервиса:
   - Определяет тип сервиса (backend/frontend)
   - Загружает `services/${service_name}/service.yaml`
   - Применяет настройки типа сервиса
   - Мержит все конфигурации в правильном порядке
   - Генерирует полные values файлы для каждого окружения
5. Сохраняет результаты в `infra/overrides/${environment}/${service_name}.yaml`

### Вывод генератора

Генератор выводит подробные логи о процессе генерации:

```
→ Starting values generation process
→ Found 2 service(s) to process: backend, frontend

  • Loading default values from defaults.yaml
  • Loading environment overrides from environment-overrides.yaml

→ Processing service: backend
  • Generating values for environment: development
  • Detecting service type for: backend
  • Service type detected: backend (NestJS)
  • Loading service config from: services/backend/service.yaml
  • Merging configurations...
  • Applying service type defaults (port: 4000)
  • Applying service-specific configuration
  • Applying environment-specific overrides
✓ Generated: infra/overrides/development/backend.yaml

→ Generation summary:
✓ Total files generated: 6
```

## Окружения

Генератор создает values файлы для трех окружений:

### Development
- `replicaCount: 1`
- Автомасштабирование отключено
- Минимальные ресурсы (cpu: 200m, memory: 256Mi)
- `NODE_ENV: development`

### Staging
- `replicaCount: 2`
- Автомасштабирование включено (2-5 реплик)
- Средние ресурсы
- `NODE_ENV: production`

### Production
- `replicaCount: 3`
- Автомасштабирование включено (3-20 реплик)
- Полные ресурсы (cpu: 1000m, memory: 1Gi)
- `NODE_ENV: production`

## Типы сервисов

Генератор автоматически определяет тип сервиса на основе `services.json`:

### Backend (NestJS)
- Порт по умолчанию: `4000`
- Health check path: `/status`
- Helm chart: `backend-service`

### Frontend (Next.js)
- Порт по умолчанию: `3000`
- Health check path: `/api/status`
- Helm chart: `frontend-service`

## Приоритет значений

Значения применяются в следующем порядке (каждый следующий переопределяет предыдущий):

1. **Базовые значения по умолчанию** - из `defaults.yaml`
2. **Тип сервиса** - устанавливает правильный порт и health check path
3. **service.yaml** - специфичные для сервиса настройки (без секции `overrides`)
4. **Окружение** - переопределения из `environment-overrides.yaml`
5. **Service-specific overrides** - секция `overrides` из `service.yaml` для конкретного окружения

## Секция overrides в service.yaml

Вы можете добавить секцию `overrides` в `service.yaml` для переопределения настроек в конкретных окружениях:

```yaml
# services/frontend/service.yaml

image:
  repository: frontend

nameOverride: "frontend"
fullnameOverride: "frontend"

autoscaling:
  enabled: true
  minReplicas: 2
  targetCPUUtilizationPercentage: 70

# Переопределения для конкретных окружений
overrides:
  production:
    # В production увеличиваем минимальное количество реплик
    autoscaling:
      minReplicas: 5
      maxReplicas: 30
  staging:
    # В staging можем использовать меньше ресурсов
    resources:
      limits:
        cpu: 300m
        memory: 384Mi
```

## Примеры

### Входной файл: `services/frontend/service.yaml`

```yaml
image:
  repository: frontend

nameOverride: "frontend"
fullnameOverride: "frontend"

env:
  PORT: "3000"
  NODE_ENV: "production"

autoscaling:
  enabled: true
  minReplicas: 2

overrides:
  production:
    autoscaling:
      minReplicas: 5
      maxReplicas: 30
```

### Выходной файл: `infra/overrides/production/frontend.yaml`

```yaml
# Generated values for frontend in production environment
# Generated at: 2025-11-30T15:15:47.180Z
# Source: services/frontend/service.yaml

replicaCount: 3

image:
  repository: frontend
  tag: ""
  pullPolicy: IfNotPresent

nameOverride: "frontend"
fullnameOverride: "frontend"

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

env:
  PORT: "3000"
  NODE_ENV: "production"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 256Mi

livenessProbe:
  httpGet:
    path: /api/status
    port: http
  initialDelaySeconds: 60
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 5

readinessProbe:
  httpGet:
    path: /api/status
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

autoscaling:
  enabled: true
  minReplicas: 5        # ← Переопределено из overrides.production
  maxReplicas: 30       # ← Переопределено из overrides.production
  targetCPUUtilizationPercentage: 70
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

## Добавление нового сервиса

1. Создайте `services/${service_name}/service.yaml` с настройками сервиса
2. Добавьте сервис в `infra/generate-service/services.json`
3. Запустите генератор: `pnpm run generate:overrides`

## Добавление нового окружения

1. Добавьте окружение в массив `ENVIRONMENTS` в `generate-values.ts`
2. Добавьте переопределения в `environment-overrides.yaml`
3. Запустите генератор

## Изменение значений по умолчанию

Отредактируйте `defaults.yaml` для изменения базовых значений, которые применяются ко всем сервисам.

## Использование в CI/CD

Сгенерированные values файлы используются при деплое:

```bash
# Development
helm upgrade --install backend ./infra/helmcharts/backend-service \
  -f infra/overrides/development/backend.yaml \
  --set image.tag=${CI_COMMIT_SHA}

# Production
helm upgrade --install backend ./infra/helmcharts/backend-service \
  -f infra/overrides/production/backend.yaml \
  --set image.tag=${CI_COMMIT_SHA}
```

## Файлы конфигурации

### defaults.yaml

Содержит базовые значения по умолчанию для всех сервисов. Эти значения актуализированы из Helm чартов `backend-service` и `frontend-service`.

### environment-overrides.yaml

Содержит переопределения для каждого окружения (development, staging, production). Эти настройки применяются ко всем сервисам в соответствующем окружении.

### templates/values.hbs

Handlebars шаблон для генерации финальных YAML файлов. Использует данные из всех источников конфигурации.

## Преимущества

- ✅ Единый источник правды для настроек сервиса
- ✅ Автоматическое применение значений по умолчанию
- ✅ Консистентность между окружениями
- ✅ Гибкие переопределения на уровне сервиса и окружения
- ✅ Легко добавлять новые сервисы и окружения
- ✅ Полные values файлы для каждого окружения
- ✅ Подробное логирование процесса генерации
- ✅ Типизация TypeScript для безопасности
- ✅ Автоматическое определение типа сервиса и применение соответствующих настроек

## Структура типов

Все типы определены в `types.ts`:

- `ServiceConfig` - полная конфигурация сервиса
- `ServiceType` - информация о типе сервиса (backend/frontend)

## Troubleshooting

### Ошибка "Service config not found"

Убедитесь, что файл `services/${service_name}/service.yaml` существует и сервис добавлен в `infra/generate-service/services.json`.

### Значения не применяются

Проверьте порядок приоритета значений. Более поздние источники переопределяют предыдущие. Используйте подробные логи для отладки.

### Неправильный тип сервиса

Убедитесь, что сервис правильно указан в `infra/generate-service/services.json` в соответствующей категории (`nest` или `next`).
