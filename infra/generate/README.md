# Supreme Infrastructure Generator

Супер-генератор, который запускает все генераторы инфраструктуры в правильном порядке.

## Описание

Этот генератор объединяет функциональность всех генераторов инфраструктуры:

1. **Router Configurations** - извлечение роутов из NestJS и Next.js сервисов
2. **Ingress Values** - генерация конфигурации ingress-nginx на основе роутов
3. **Security Checks** - обновление GitHub Actions workflow для security проверок
4. **CD Workflow** - обновление GitHub Actions workflow для continuous deployment
5. **Database Workflow** - обновление GitHub Actions workflow для database migrations
6. **Database Values** - генерация Helm values для PostgreSQL баз данных
7. **Values Files** - генерация Helm values файлов для всех окружений

## Генератор сервисов

Для создания нового микросервиса используйте:

```bash
pnpm run generate:service
```

Интерактивный генератор создаст полную структуру NestJS или Next.js сервиса.
Подробнее: [generate-service/README.md](./generate-service/README.md)

## Использование

```bash
pnpm run generate
```

## Что делает генератор

### Step 1: Generating router configurations

- Запускает NestJS сервисы через специальный скрипт `print-routes`
- Извлекает роуты из логов `[RouterExplorer]`
- Для Next.js сканирует `app` директорию и находит `page.tsx` и `route.ts` файлы
- Конвертирует параметры роутов (`:id` → `[^/]+`) для ingress-nginx regex
- Сохраняет результаты в `services/${service}/router.yaml`

### Step 2: Updating ingress values

- Читает все `services/*/router.yaml` файлы
- Генерирует правила маршрутизации для ingress-nginx
- NestJS сервисы: `/api` → backend (с rewrite)
- Next.js сервисы: `/` → frontend (без rewrite)
- Сохраняет результаты в `infra/helmcharts/ingress-nginx/values.yaml`

### Step 3: Updating security checks

- Читает список сервисов из `infra/services.yaml`
- Обновляет `.github/workflows/security-checks.yml`
- Добавляет все NestJS сервисы в matrix для security-scan-nest
- Добавляет все Next.js сервисы в matrix для security-scan-next

### Step 4: Updating CD workflow

- Читает список сервисов из `infra/services.yaml`
- Обновляет `.github/workflows/cd.yml`
- Добавляет все сервисы в список options для manual deployment
- Устанавливает первый сервис как default

### Step 5: Generating values files

- Читает список сервисов из `infra/services.yaml`
- Для каждого сервиса генерирует полные Helm values файлы
- Создает файлы для всех окружений (development, staging, production)
- Применяет настройки типа сервиса, environment overrides и service-specific overrides
- Сохраняет результаты в `infra/overrides/${environment}/${service_name}.yaml`

## Добавление нового сервиса

1. Добавьте сервис в `infra/services.yaml`:

```yaml
services:
  - name: my-new-service
    type: nest # или next
    description: My new service description
```

2. Создайте `services/my-new-service/service.yaml` с настройками

3. Запустите генератор:

```bash
pnpm run generate
```

Генератор автоматически:

- Добавит сервис в security checks workflow
- Добавит сервис в CD workflow
- Сгенерирует values файлы для всех окружений

## Отдельные генераторы

Вы также можете запускать генераторы по отдельности:

```bash
# Только security checks и CD workflow
pnpm run infra:generate

# Только values файлы
pnpm run generate:overrides
```

## Структура

```
infra/
├── generate/
│   ├── index.ts          # Супер-генератор (точка входа)
│   └── README.md         # Эта документация
├── generate-service/
│   ├── update-security-checks.ts
│   └── update-cd-workflow.ts
├── generate-values/
│   ├── generate-values.ts
│   ├── defaults.yaml
│   ├── environment-overrides.yaml
│   └── templates/
├── shared/
│   └── load-services.ts  # Утилита для загрузки services.yaml
└── services.yaml         # Единый источник правды для всех сервисов
```

## Преимущества

- ✅ Единая команда для всех генераторов
- ✅ Единый источник правды (`services.yaml`)
- ✅ Последовательное выполнение в правильном порядке
- ✅ Подробное логирование каждого шага
- ✅ Автоматическое обновление всех конфигураций
- ✅ Консистентность между всеми частями инфраструктуры

## Когда запускать

Запускайте генератор после:

- Добавления нового сервиса
- Изменения настроек сервиса в `service.yaml`
- Изменения базовых значений в `defaults.yaml`
- Изменения environment overrides

## Troubleshooting

### Ошибка "No services found"

Убедитесь, что `infra/services.yaml` существует и содержит хотя бы один сервис.

### Ошибка при обновлении workflows

Проверьте, что файлы `.github/workflows/security-checks.yml` и `.github/workflows/cd.yml` существуют и имеют правильную структуру.

### Ошибка при генерации values

Убедитесь, что для каждого сервиса существует файл `services/${service_name}/service.yaml`.
