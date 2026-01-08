# PostgreSQL Migration Summary

## Что было сделано

Данные пользователей перенесены из оперативной памяти приложения в PostgreSQL базу данных.

## Созданные файлы

### Helm Chart для PostgreSQL

- `infra/helmcharts/postgresql/Chart.yaml` - метаданные chart'а
- `infra/helmcharts/postgresql/values.yaml` - конфигурация по умолчанию
- `infra/helmcharts/postgresql/templates/` - Kubernetes манифесты
  - `_helpers.tpl` - helper функции
  - `secret.yaml` - секреты БД
  - `service.yaml` - Kubernetes Service
  - `statefulset.yaml` - StatefulSet для PostgreSQL
- `infra/helmcharts/postgresql/environment-overrides.yaml` - overrides для окружений
- `infra/helmcharts/postgresql/README.md` - документация chart'а

### Backend изменения

- `services/backend/src/features/Auth/model/entities/User.entity.ts` - TypeORM entities
- `infra/databases/backend-db/data-source.ts` - конфигурация TypeORM
- `infra/databases/backend-db/migrations/1704700000000-InitialUsers.ts` - миграция начальных данных
- `infra/databases/backend-db/README.md` - документация БД
- `services/backend/docker-compose.dev.yml` - Docker Compose для локальной разработки
- `services/backend/env.example` - пример переменных окружения
- `services/backend/README.md` - обновленная документация сервиса

### Генератор инфраструктуры

- `infra/generate/generate-database-values/` - генератор database values
  - `types.ts` - типы для конфигурации БД
  - `generate-database-values.ts` - логика генерации
  - `index.ts` - точка входа
  - `README.md` - документация генератора

### Документация

- `docs/database-setup.md` - полная документация по PostgreSQL
- `docs/quick-start-database.md` - быстрая инструкция по деплою
- `docs/database-migration-guide.md` - руководство по миграции
- `docs/adding-new-database.md` - руководство по добавлению новой БД
- `MIGRATION_SUMMARY.md` - этот файл

## Измененные файлы

### Зависимости

- `pnpm-workspace.yaml` - добавлены TypeORM зависимости:
  - `@nestjs/typeorm: ^11.0.0`
  - `typeorm: ^0.3.20`
  - `pg: ^8.13.1`
- `services/backend/package.json` - добавлены те же зависимости + скрипты для миграций

### Backend код

- `services/backend/src/app.module.ts` - добавлена конфигурация TypeORM
- `services/backend/src/features/Auth/api/Auth.module.ts` - подключены TypeORM репозитории
- `services/backend/src/features/Auth/model/Users.service.ts` - переписан для работы с БД

### Конфигурация

- `services.yaml` - добавлена секция database для сервисов
- `services/backend/service.yaml` - добавлены переменные окружения БД:
  - `DB_HOST: postgresql-backend`
  - `DB_PORT: 5432`
  - `DB_NAME: backend_db`
  - `DB_USER: backend_user`
  - `DB_PASSWORD` (из секретов)
- `infra/overrides/development/backend.yaml` - автоматически обновлен генератором
- `infra/overrides/production/backend.yaml` - автоматически обновлен генератором
- `infra/overrides/development/postgresql-backend.yaml` - сгенерирован автоматически
- `infra/overrides/production/postgresql-backend.yaml` - сгенерирован автоматически
- `infra/generate/index.ts` - добавлен шаг генерации database values

### Документация

- `readme.md` - добавлена информация о PostgreSQL и ссылки на документацию

## Технические детали

### База данных

**Таблицы:**

1. `users` - пользователи системы
   - id (PK, auto-increment)
   - email (unique)
   - password (bcrypt hash)
   - name
   - role (user/moderator/admin)
   - created_at

2. `recipe_likes` - лайки рецептов
   - id (PK, auto-increment)
   - user_id (FK -> users)
   - recipe_id
   - liked_at

**Начальные данные:**

- admin@example.com / admin123 (admin)
- moder@example.com / moder123 (moderator)
- user@example.com / user123 (user)

### Архитектура

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐      ┌──────────────┐
│   Backend       │◄────►│  PostgreSQL  │
│   (NestJS)      │ SQL  │  (StatefulSet)│
└─────────────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│   TypeORM       │
│   Entities      │
└─────────────────┘
```

### Режимы работы

**Development:**

- `synchronize: true` - автоматическое создание таблиц
- `logging: true` - логирование SQL запросов
- Меньше ресурсов (250m CPU, 256Mi RAM)

**Production:**

- `synchronize: false` - миграции вручную
- `logging: false` - без логирования SQL
- Больше ресурсов (1000m CPU, 1Gi RAM)

## Что нужно сделать для деплоя

### 1. Добавить секрет в GitHub

```bash
# В GitHub Settings -> Secrets добавьте:
DB_PASSWORD = ваш_безопасный_пароль
```

### 2. Установить зависимости

```bash
cd /path/to/supreme-infra
pnpm install
```

### 3. Задеплоить PostgreSQL

```bash
# Development
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password=dev_password

# Production
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace production \
  --set database.password=$DB_PASSWORD
```

### 4. Задеплоить Backend

Создайте PR и запустите release pipeline через GitHub Actions.

## Проверка работоспособности

```bash
# 1. Проверить PostgreSQL
kubectl get pods -l app.kubernetes.io/name=postgresql
kubectl logs postgresql-0

# 2. Проверить Backend
kubectl get pods -l app.kubernetes.io/name=backend
kubectl logs -l app.kubernetes.io/name=backend --tail=50

# 3. Проверить подключение к БД
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "SELECT COUNT(*) FROM users;"

# 4. Проверить авторизацию через UI
# Откройте frontend и попробуйте залогиниться: admin@example.com / admin123
```

## Откат (если что-то пошло не так)

```bash
# 1. Откатить backend на предыдущую версию
kubectl rollout undo deployment/backend

# 2. Удалить PostgreSQL (если нужно)
helm uninstall postgresql --namespace default

# 3. Проверить статус
kubectl rollout status deployment/backend
```

## Локальная разработка

```bash
# 1. Запустить PostgreSQL
cd services/backend
docker-compose -f docker-compose.dev.yml up -d

# 2. Скопировать env файл
cp env.example .env

# 3. Запустить backend
pnpm run dev
```

## Полезные команды

```bash
# Подключиться к БД
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db

# Посмотреть пользователей
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "SELECT id, email, name, role FROM users;"

# Создать бэкап
kubectl exec postgresql-0 -- pg_dump -U auth_user auth_db > backup.sql

# Восстановить из бэкапа
kubectl exec -i postgresql-0 -- psql -U auth_user auth_db < backup.sql

# Проверить размер БД
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "SELECT pg_size_pretty(pg_database_size('auth_db'));"
```

## Мониторинг

### Метрики PostgreSQL

- CPU и Memory usage через Kubernetes metrics
- Connection count через pg_stat_activity
- Database size через pg_database_size

### Логи

```bash
# PostgreSQL логи
kubectl logs postgresql-0 -f

# Backend логи (с SQL запросами в dev)
kubectl logs -l app.kubernetes.io/name=backend -f
```

### Health Checks

- PostgreSQL: `pg_isready` probe каждые 10 секунд
- Backend: `/api/status` endpoint

## Безопасность

✅ **Что сделано:**

- Пароли хранятся в Kubernetes Secrets
- PostgreSQL доступен только внутри кластера (ClusterIP)
- Пароли пользователей хешируются через bcrypt
- JWT токены с expiration (7 дней)

⚠️ **Рекомендации:**

- Используйте сильные пароли в production
- Регулярно делайте бэкапы
- Настройте автоматические бэкапы через CronJob
- Мониторьте использование ресурсов
- Рассмотрите использование managed PostgreSQL для production

## Дополнительные ресурсы

- [Полная документация по PostgreSQL](docs/database-setup.md)
- [Быстрый старт](docs/quick-start-database.md)
- [Руководство по миграции](docs/database-migration-guide.md)
- [README бэкенда](services/backend/README.md)

## Контакты

При возникновении проблем:

1. Проверьте документацию выше
2. Посмотрите логи: `kubectl logs <pod-name>`
3. Проверьте статус: `kubectl describe <resource>`
4. Обратитесь к команде DevOps

---

**Дата миграции:** 2026-01-08  
**Версия PostgreSQL:** 16-alpine  
**Версия TypeORM:** 0.3.20  
**Статус:** ✅ Готово к деплою
