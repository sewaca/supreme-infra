# PostgreSQL Database Setup

Этот документ описывает настройку PostgreSQL базы данных для системы авторизации.

## Обзор

База данных PostgreSQL используется для хранения:

- Пользователей (users)
- Лайков рецептов (recipe_likes)

## Архитектура

### Компоненты

1. **PostgreSQL StatefulSet** - основная база данных
2. **Backend Service** - подключается к БД через TypeORM
3. **Secrets** - хранят учетные данные БД

### Схема данных

#### Таблица `users`

- `id` - первичный ключ (auto-increment)
- `email` - уникальный email пользователя
- `password` - хешированный пароль (bcrypt)
- `name` - имя пользователя
- `role` - роль (user, moderator, admin)
- `created_at` - дата создания

#### Таблица `recipe_likes`

- `id` - первичный ключ (auto-increment)
- `user_id` - внешний ключ на users
- `recipe_id` - ID рецепта
- `liked_at` - дата лайка

## Деплой PostgreSQL

### Development

```bash
# 1. Установить PostgreSQL
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password=dev_password

# 2. Дождаться готовности
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql --timeout=120s

# 3. Проверить подключение
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "SELECT version();"
```

### Production

```bash
# 1. Создать secret с паролем БД
kubectl create secret generic postgresql-password \
  --from-literal=password=$DB_PASSWORD \
  --namespace production

# 2. Установить PostgreSQL
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace production \
  --set database.password=$DB_PASSWORD \
  -f infra/helmcharts/postgresql/environment-overrides.yaml

# 3. Дождаться готовности
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql \
  --namespace production \
  --timeout=120s
```

## Настройка Backend

Backend автоматически подключается к PostgreSQL используя переменные окружения:

- `DB_HOST` - хост БД (по умолчанию: postgresql)
- `DB_PORT` - порт БД (по умолчанию: 5432)
- `DB_NAME` - имя БД (по умолчанию: auth_db)
- `DB_USER` - пользователь БД (по умолчанию: auth_user)
- `DB_PASSWORD` - пароль БД (из секретов)

### Миграции

Backend использует TypeORM для управления схемой БД:

```bash
# В development режиме synchronize: true автоматически создает таблицы

# В production нужно запустить миграции вручную:
cd services/backend
pnpm run migration:run
```

### Начальные данные

При первом запуске автоматически создаются три пользователя:

1. **Admin** - admin@example.com (пароль: admin123)
2. **Moderator** - moder@example.com (пароль: moder123)
3. **User** - user@example.com (пароль: user123)

## Мониторинг

### Проверка статуса

```bash
# Статус pod'а
kubectl get pods -l app.kubernetes.io/name=postgresql

# Логи
kubectl logs -l app.kubernetes.io/name=postgresql

# Подключение к БД
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db
```

### Health Checks

PostgreSQL имеет настроенные health checks:

- **Liveness Probe**: проверяет, что PostgreSQL запущен
- **Readiness Probe**: проверяет, что PostgreSQL готов принимать соединения

## Backup и Restore

### Создание бэкапа

```bash
# Бэкап всей БД
kubectl exec postgresql-0 -- pg_dump -U auth_user auth_db > backup-$(date +%Y%m%d-%H%M%S).sql

# Бэкап только данных
kubectl exec postgresql-0 -- pg_dump -U auth_user auth_db --data-only > data-backup.sql
```

### Восстановление из бэкапа

```bash
# Восстановление
kubectl exec -i postgresql-0 -- psql -U auth_user auth_db < backup.sql

# Очистка перед восстановлением
kubectl exec -i postgresql-0 -- psql -U auth_user auth_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
kubectl exec -i postgresql-0 -- psql -U auth_user auth_db < backup.sql
```

## Безопасность

### Секреты

Пароль БД хранится в Kubernetes Secret и передается через переменные окружения.

**Важно**: Никогда не коммитьте пароли в Git!

### Доступ

- PostgreSQL доступен только внутри кластера (ClusterIP service)
- Backend подключается по внутреннему DNS: `postgresql.default.svc.cluster.local`
- Внешний доступ возможен только через port-forward:

```bash
kubectl port-forward svc/postgresql 5432:5432
```

### Рекомендации

1. Используйте сильные пароли в production
2. Регулярно делайте бэкапы
3. Мониторьте использование ресурсов
4. Настройте автоматические бэкапы через CronJob
5. Используйте отдельные БД для разных окружений

## Troubleshooting

### Pod не запускается

```bash
# Проверить события
kubectl describe pod postgresql-0

# Проверить PVC
kubectl get pvc
kubectl describe pvc data-postgresql-0
```

### Проблемы с подключением

```bash
# Проверить service
kubectl get svc postgresql
kubectl describe svc postgresql

# Проверить переменные окружения в backend
kubectl exec -it <backend-pod> -- env | grep DB_
```

### Медленная работа

```bash
# Проверить логи PostgreSQL
kubectl logs postgresql-0

# Подключиться и проверить активные запросы
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "SELECT * FROM pg_stat_activity;"
```

## Обновление

### Обновление версии PostgreSQL

```bash
# 1. Создать бэкап
kubectl exec postgresql-0 -- pg_dump -U auth_user auth_db > backup-before-upgrade.sql

# 2. Обновить версию в values.yaml
# image.tag: "17-alpine"

# 3. Применить обновление
helm upgrade postgresql ./infra/helmcharts/postgresql

# 4. Проверить работоспособность
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "SELECT version();"
```

## Масштабирование

Текущая конфигурация использует один экземпляр PostgreSQL (StatefulSet с 1 репликой).

Для production рекомендуется:

- Настроить репликацию (master-slave)
- Использовать managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Настроить connection pooling (PgBouncer)

## Дополнительные ресурсы

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
