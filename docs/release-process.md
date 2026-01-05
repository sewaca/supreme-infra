# Процесс релиза

Этот документ описывает полный pipeline релиза для монопрепозитория supreme-infra, включая обычные релизы, откаты и canary развертывания.

## Обзор

Процесс релиза полностью автоматизирован и использует GitHub Actions с ручными воротами одобрения. Все релизы проходят через canary стадию перед полным production развертыванием для безопасности.

## Архитектура Release Pipeline

### Основные компоненты

1. **GitHub Actions Workflows** (`.github/workflows/cd.yml`)
2. **Helm Charts** (`infra/helmcharts/`)
3. **Генератор инфраструктуры** (`infra/generate/`)
4. **Интеграция с Yandex Cloud** (Kubernetes развертывание)

### Поток релиза

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Ручной триггер │ -> │  Определение     │ -> │ Расчет версии   │
│                 │    │   режима релиза  │    │                 │
│                 │    │   (Обычный/Откат)│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Security Scan   │ -> │   Сборка и      │ -> │ Создание релиза │
│                 │    │   Push Docker   │    │   ветки и тега   │
│                 │    │    образа       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        v
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Canary Deploy   │ -> │   Ручная        │ -> │ Production      │
│ (50% трафика)   │    │   проверка и    │    │   продвижение   │
│                 │    │   одобрение     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Запуск релиза

### Обычный релиз

1. **Перейти в GitHub Actions**:
   - Перейдите во вкладку `Actions` в репозитории
   - Найдите workflow "Create Release Pipeline"

2. **Ручной триггер**:
   - Нажмите "Run workflow"
   - Выберите сервис для развертывания из выпадающего списка:
     - `backend` (сервис NestJS)
     - `frontend` (сервис Next.js)

3. **Выполнение workflow**:
   - Workflow автоматически определит следующую версию
   - На основе сообщений коммитов с момента последнего релиза

### Релиз отката

Для отката к предыдущей версии:

1. **Перейти в GitHub Actions**:
   - Найдите workflow "Create Release Pipeline"
   - Нажмите "Run workflow"

2. **Настроить откат**:
   - Выберите сервис для отката
   - **Важно**: В поле `release_branch` введите имя ветки релиза:
     ```
     releases/production/backend-1.2.3
     ```

3. **Поведение workflow**:
   - Определяет режим отката по имени ветки
   - Извлекает версию из ветки (например, `1.2.3`)
   - Валидирует существование Docker образа для этой версии
   - Перебазирует ветку релиза на main (свежая инфраструктура)
   - Развертывает откат через canary стадию

## Расчет версии

### Автоматическое повышение версии

Система анализирует сообщения коммитов для определения повышения версии:

**Паттерны сообщений коммитов**:

- `major:*` или `BREAKING*` → Major версия (X+1.0.0)
- `minor:*` или `feat:*` → Minor версия (x.Y+1.0)
- `fix:*` или `patch:*` → Patch версия (x.y.Z+1)
- `chore:*` → Без повышения версии (релиз отката)

**Примеры**:

```
major: Refactored authentication system  → 2.0.0
minor(ui): Added dark mode toggle      → 1.3.0
fix: Fixed memory leak                 → 1.2.4
chore: Updated dependencies           → 1.2.3-abc12345 (откат)
```

### Теги версий

**Теги обычных релизов**:

- Формат: `{service}-v{major}.{minor}.{patch}`
- Пример: `backend-v1.2.3`

**Теги chore/отката**:

- Формат: `{service}-v{version}-{hash}`
- Пример: `backend-v1.2.3-abc12345`

**Теги отката**:

- Формат: `{service}-rollback-v{version}-{short-sha}`
- Пример: `backend-rollback-v1.2.3-def456`

## Canary развертывание

### Что такое Canary развертывание?

Canary развертывание - это стратегия развертывания, при которой:

- Новая версия развертывается рядом со старой версией
- Трафик разделяется между версиями (50/50 в этой настройке)
- Позволяет тестирование в production с минимальным риском
- Легкий откат при обнаружении проблем

### Как это работает в Supreme-Infra

1. **Развертывание**:
   - Создает отдельный Deployment: `{service}-canary`
   - Устанавливает лейбл `app.kubernetes.io/variant: canary`
   - Добавляет переменную окружения `CANARY=true`
   - Выделяет 50% от текущего количества реплик

2. **Разделение трафика**:
   - Service направляет трафик на оба stable и canary поды
   - Использует одинаковые селектор лейблы (Kubernetes load balancing)
   - Примерно 50% трафика на каждую версию

3. **Мониторинг**:
   - Проверьте логи canary подов: `kubectl logs -l app.kubernetes.io/variant=canary`
   - Мониторьте метрики и уровни ошибок
   - Просмотрите специфические для canary переменные окружения

### Процесс ручного одобрения

**Workflow одобрения**:

1. Pipeline создает GitHub Issue для одобрения
2. Заголовок: `"Approve canary promotion: {service} v{version}"`
3. Тело содержит детали развертывания и инструкции
4. Комментируйте `approve` или `lgtm` для продолжения
5. Комментируйте `deny` для отмены развертывания

**Таймаут**: 60 минут (затем авто-отмена)

## Продвижение в Production

### Успешный Canary → Production

1. **При одобрении**:
   - Обновляет main deployment новым образом
   - Удаляет canary deployment
   - Масштабирует до полного количества реплик

2. **Используемые Helm команды**:

```bash
# Развернуть canary
helm upgrade $SERVICE $CHART_PATH \
  -f $OVERRIDES_FILE \
  --set canary.enabled=true \
  --set canary.replicas=2 \
  --set canary.image.tag="production-backend-v1.2.3" \
  --install --wait --timeout 5m

# Продвинуть в production
helm upgrade $SERVICE $CHART_PATH \
  -f $OVERRIDES_FILE \
  --set image.tag="production-backend-v1.2.3" \
  --set canary.enabled=false \
  --install --wait --timeout 5m --atomic
```

### Обработка отмены

**Если Canary отклонен**:

- Canary поды очищаются при следующем развертывании
- Старая версия продолжает обслуживать трафик
- Нет прерывания обслуживания

## Процесс отката

### Когда делать откат

- Критические баги в production
- Проблемы производительности
- Провал canary тестирования
- Уязвимости безопасности

### Шаги отката

1. **Определить целевую версию**:
   - Проверить GitHub releases на предыдущие версии
   - Убедиться, что Docker образ существует в registry
   - Запомнить имя ветки релиза (например, `releases/production/backend-1.2.3`)

2. **Инициировать откат**:
   - Запустить workflow "Create Release Pipeline"
   - Выбрать сервис и ввести имя ветки релиза
   - Workflow обработает все остальное автоматически

3. **Что происходит во время отката**:
   - Валидирует существование ветки релиза
   - Проверяет доступность Docker образа
   - Перебазирует ветку на main (свежая инфраструктура)
   - Создает rollback GitHub release
   - Развертывает через canary стадию (те же меры безопасности)
   - Требует ручного одобрения

### Rollback Validation

**Pre-rollback Checks**:

- Release branch exists
- Docker image exists in registry
- Infrastructure configs are current (via rebase)

## Управление Docker образами

### Соглашение об именовании образов

Формат: `{DOCKER_HUB_USERNAME}/supreme:production-{service}-v{version}`

**Пример**: `sewaca/supreme:production-backend-v1.2.3`

### Image Registry

- **Registry**: Docker Hub
- **Repository**: `supreme`
- **Username**: Настраивается через secret `DOCKER_HUB_USERNAME`
- **Доступ**: Требует прав на запись для push

### Жизненный цикл образов

1. **Сборка**: Во время release pipeline
2. **Push**: В Docker Hub registry
3. **Pull**: Kubernetes во время развертывания
4. **Хранение**: Образы сохраняются бесконечно (ручная очистка при необходимости)

## GitHub Environments

### Требуемые окружения

1. **canary** (опциональное одобрение):
   - Используется для canary развертываний
   - Может быть авто-одобрено или требовать reviewers

2. **production** (обязательное одобрение):
   - Используется для production продвижений
   - Требует ручного одобрения от авторизованных reviewers

### Конфигурация окружений

Настройка в Settings репозитория → Environments:

- Добавить окружение `canary`
- Добавить окружение `production`
- Настроить branch protection при необходимости

## Branch Management

### Release Branches

**Naming**: `releases/production/{service}-{version}`
**Example**: `releases/production/frontend-3.1.5`

**Purpose**:

- Track which version is deployed where
- Enable rollbacks to specific versions
- Maintain deployment history

### Branch Lifecycle

1. **Created**: During release process
2. **Used**: For rollbacks and tracking
3. **Maintained**: Automatically updated with infrastructure changes
4. **Archived**: Never deleted (historical record)

## Структура Helm Charts

### Организация чартов

```
infra/helmcharts/
├── backend-service/          # Сервисы NestJS
│   ├── templates/
│   │   ├── deployment.yaml
│   │   ├── canary-deployment.yaml
│   │   └── service.yaml
│   └── values.yaml
└── frontend-service/         # Сервисы Next.js
    └── (такая же структура)
```

### Ключевые значения

```yaml
image:
  repository: "sewaca/supreme"
  tag: "production-backend-v1.2.3"

canary:
  enabled: false
  replicas: 1
  image:
    repository: ""
    tag: ""

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
```

## Устранение неисправностей

### Распространенные проблемы

#### "Нет новых коммитов с момента последнего релиза"

- **Причина**: Нет коммитов с ключевыми словами повышения версии
- **Решение**: Добавить коммиты с правильными префиксами или форсировать повышение версии

#### "Docker образ не найден"

- **Причина**: Образ был удален или сборка провалилась
- **Решение**: Проверить Docker Hub repository, пересобрать при необходимости

#### "Таймаут Helm развертывания"

- **Причина**: Поды не становятся ready в течение таймаута
- **Решение**: Проверить статус подов, логи и ограничения ресурсов

#### "Canary поды не получают трафик"

- **Причина**: Несоответствие селекторов сервиса
- **Решение**: Убедиться, что лейблы подов соответствуют селекторам сервиса

### Мониторинг развертываний

```bash
# Проверить статус deployment
kubectl get deployments -l app.kubernetes.io/name=backend

# Проверить canary поды
kubectl get pods -l app.kubernetes.io/variant=canary

# Посмотреть логи подов
kubectl logs -l app.kubernetes.io/name=backend --tail=100

# Проверить endpoints сервиса
kubectl get endpoints backend
```

### Восстановление после провала развертывания

1. **Проверить статус пода**:

   ```bash
   kubectl describe pod <pod-name>
   ```

2. **Просмотреть события**:

   ```bash
   kubectl get events --sort-by=.metadata.creationTimestamp
   ```

3. **Проверить использование ресурсов**:

   ```bash
   kubectl top pods
   ```

4. **Опции отката**:
   - Использовать workflow отката
   - Уменьшить масштаб проблемного deployment
   - Восстановить из предыдущего релиза

## Соображения безопасности

### Управление секретами

**Требуемые секреты** (GitHub repository secrets):

- `DOCKER_HUB_USERNAME` - Docker Hub username
- `DOCKER_HUB_TOKEN` - Docker Hub access token
- `YC_SA_JSON_CREDENTIALS` - Yandex Cloud service account
- `YC_CLOUD_ID` - Yandex Cloud project ID
- `YC_FOLDER_ID` - Yandex Cloud folder ID
- `YC_K8S_CLUSTER_ID` - Kubernetes cluster ID
- `PAT` - GitHub personal access token (для Madara Robot)

### Контроль доступа

- **Защита окружений**: Production развертывания требуют одобрения
- **Защита веток**: Правила защиты main ветки
- **Разрешения токенов**: Ограниченный scope для автоматизированных операций

## Точки интеграции

### Генератор инфраструктуры

Процесс релиза интегрируется с генератором инфраструктуры:

- Обновляет списки сервисов в workflows
- Генерирует файлы values Helm
- Поддерживает согласованность конфигурации

### Madara Robot

Автоматизированная поддержка во время релизов:

- Pre-commit исправления
- Обновления инфраструктуры
- Обеспечение quality gates

### CI Pipeline

Pipeline релиза зависит от успешного CI:

- Security сканирования должны пройти
- Тесты должны успешно выполниться
- Проверки качества кода обязательны

Этот комплексный процесс релиза обеспечивает безопасные, автоматизированные развертывания с множественными воротами безопасности и возможностями отката.
