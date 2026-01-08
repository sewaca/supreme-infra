# Итоговая конфигурация базы данных

## ✅ Что сделано

### 1. Миграция с in-memory на PostgreSQL

- ✅ Интегрирован TypeORM в backend
- ✅ Созданы entities: `UserEntity`, `RecipeLikeEntity`
- ✅ Обновлен `UsersService` для работы с БД
- ✅ Начальные данные перенесены в `init.sql`

### 2. Helm chart для PostgreSQL

- ✅ Создан универсальный chart: `infra/helmcharts/postgresql/`
- ✅ Поддержка init scripts через ConfigMap
- ✅ Автоматическое применение `init.sql` при первом запуске

### 3. Генераторы конфигурации

- ✅ `generate-database-values` - создает values для PostgreSQL
- ✅ `update-database-workflow` - обновляет список сервисов в workflow
- ✅ `update-cd-workflow` - анализирует секреты для БД
- ✅ Все интегрировано в `pnpm run generate`

### 4. GitHub Actions workflows

- ✅ `deploy-database.yml` - деплой PostgreSQL
  - Действия: install, upgrade, uninstall
  - Namespace: default
  - Динамический список сервисов из `services.yaml`
- ✅ `cd.yml` - обновлен для передачи DB_PASSWORD
  - Автоматически читает `passwordSecret` из `services.yaml`
  - Поддержка разных секретов для разных сервисов

### 5. Конфигурация в services.yaml

```yaml
services:
  nest:
    - name: backend
      database:
        enabled: true
        name: backend_db
        user: backend_user
        passwordSecret: DB_PASSWORD # ← настраиваемое имя секрета
```

### 6. Документация

- ✅ `docs/database-deployment-workflow.md` - полный гайд по workflow
- ✅ `docs/database-init-scripts.md` - работа с init.sql
- ✅ `docs/database-secrets-configuration.md` - настройка секретов
- ✅ `DATABASE_PASSWORD_SETUP.md` - быстрая настройка
- ✅ `DEPLOY_DATABASE_GUIDE.md` - гайд по деплою

## 🔑 Как работает пароль БД

### Настройка

```yaml
# services.yaml
database:
  passwordSecret: DB_PASSWORD # ← имя GitHub Secret
```

### Деплой PostgreSQL

```bash
# deploy-database.yml
helm install postgresql-backend \
  --set database.password="${{ secrets.DB_PASSWORD }}"
```

### Деплой Backend

```bash
# cd.yml автоматически:
1. Читает passwordSecret из services.yaml
2. Получает значение из secrets[passwordSecret]
3. Передает в helm: --set secrets.DB_PASSWORD="..."
```

### Backend подключается

```typescript
// Backend читает из env
password: configService.get("DB_PASSWORD");
```

## 📁 Структура файлов

```
supreme-infra/
├── services.yaml                          # Центральная конфигурация
├── infra/
│   ├── databases/
│   │   └── backend-db/
│   │       ├── init.sql                   # Начальные данные
│   │       ├── data-source.ts             # TypeORM config
│   │       └── README.md
│   ├── helmcharts/
│   │   └── postgresql/                    # Helm chart для PostgreSQL
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       └── templates/
│   ├── overrides/
│   │   ├── development/
│   │   │   ├── backend.yaml               # Backend overrides
│   │   │   └── postgresql-backend.yaml    # PostgreSQL overrides
│   │   └── production/
│   │       ├── backend.yaml
│   │       └── postgresql-backend.yaml
│   └── generate/
│       ├── generate-database-values/      # Генератор values для БД
│       ├── update-database-workflow/      # Обновление workflow
│       └── update-cd-workflow/            # Анализ секретов
├── .github/workflows/
│   ├── deploy-database.yml                # Деплой PostgreSQL
│   └── cd.yml                             # Деплой сервисов (обновлен)
└── services/backend/
    └── src/
        ├── app.module.ts                  # TypeORM config
        └── features/Auth/
            └── model/
                ├── entities/
                │   └── User.entity.ts     # TypeORM entities
                └── Users.service.ts       # Обновлен для БД
```

## 🚀 Как использовать

### Первичная настройка

1. **Установите секрет в GitHub**:
   - Settings → Secrets → `DB_PASSWORD` = `your_password`

2. **Задеплойте PostgreSQL**:
   - GitHub Actions → Deploy Database
   - Service: `backend`, Action: `install`

3. **Задеплойте backend**:
   - GitHub Actions → Create Release Pipeline
   - Service: `backend`

### Добавление нового сервиса с БД

1. **Обновите services.yaml**:

```yaml
services:
  nest:
    - name: new-service
      database:
        enabled: true
        name: new_service_db
        user: new_service_user
        passwordSecret: NEW_SERVICE_DB_PASSWORD
```

2. **Создайте init.sql**:

```bash
mkdir -p infra/databases/new-service-db
touch infra/databases/new-service-db/init.sql
```

3. **Запустите генератор**:

```bash
pnpm run generate
```

4. **Добавьте секрет в GitHub**:
   - `NEW_SERVICE_DB_PASSWORD` = `password`

5. **Задеплойте БД**:
   - GitHub Actions → Deploy Database
   - Service: `new-service`

## 🔧 Полезные команды

### Проверка конфигурации

```bash
# Посмотреть какой секрет использует сервис
yq eval '.services.nest[] | select(.name == "backend") | .database.passwordSecret' services.yaml

# Проверить что БД запущена
kubectl get pods -n default | grep postgresql

# Проверить переменные окружения backend
kubectl exec deployment/backend -n default -- env | grep DB_
```

### Подключение к БД

```bash
# Из кластера
kubectl exec -it postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db

# Port-forward для локального доступа
kubectl port-forward postgresql-backend-0 5432:5432 -n default
psql -h localhost -U backend_user -d backend_db
```

### Проверка данных

```bash
# Проверить пользователей
kubectl exec postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db \
  -c "SELECT email, name, role FROM users;"
```

## 📚 Документация

| Файл                                     | Описание                 |
| ---------------------------------------- | ------------------------ |
| `DATABASE_PASSWORD_SETUP.md`             | Быстрая настройка пароля |
| `DEPLOY_DATABASE_GUIDE.md`               | Гайд по деплою БД        |
| `docs/database-deployment-workflow.md`   | Полный гайд по workflow  |
| `docs/database-init-scripts.md`          | Работа с init scripts    |
| `docs/database-secrets-configuration.md` | Настройка секретов       |

## ⚠️ Важные моменты

1. **Пароли должны совпадать**: PostgreSQL и backend используют один секрет
2. **init.sql выполняется один раз**: только при первом запуске контейнера
3. **upgrade безопасен**: не удаляет данные, только обновляет конфигурацию
4. **Namespace = default**: все в одном namespace для простоты DNS
5. **Секреты настраиваемые**: можно использовать разные для разных сервисов

## 🎯 Следующие шаги

1. ✅ Убедитесь что секрет `DB_PASSWORD` установлен в GitHub
2. ✅ Задеплойте PostgreSQL через workflow
3. ✅ Задеплойте backend через workflow
4. ✅ Проверьте что backend подключился к БД
5. ✅ Проверьте что начальные пользователи созданы
