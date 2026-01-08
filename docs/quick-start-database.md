# Quick Start: PostgreSQL Database

Быстрая инструкция по деплою PostgreSQL для авторизации.

## Шаг 1: Деплой PostgreSQL

### Development

```bash
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password=dev_password
```

### Production

```bash
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace production \
  --set database.password=$DB_PASSWORD
```

## Шаг 2: Проверка статуса

```bash
# Проверить, что pod запущен
kubectl get pods -l app.kubernetes.io/name=postgresql

# Дождаться готовности
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql --timeout=120s
```

## Шаг 3: Деплой Backend

Backend автоматически подключится к БД. Убедитесь, что в GitHub Secrets добавлен `DB_PASSWORD`:

```bash
# В GitHub Settings -> Secrets добавьте:
# DB_PASSWORD = ваш_пароль_от_бд
```

## Шаг 4: Проверка подключения

```bash
# Проверить логи backend
kubectl logs -l app.kubernetes.io/name=backend

# Должны увидеть успешное подключение к БД
```

## Готово!

Теперь данные пользователей хранятся в PostgreSQL, а не в памяти приложения.

### Начальные пользователи

- **admin@example.com** / admin123 (роль: admin)
- **moder@example.com** / moder123 (роль: moderator)
- **user@example.com** / user123 (роль: user)

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
```

## Troubleshooting

### Backend не может подключиться к БД

1. Проверьте, что PostgreSQL запущен:

   ```bash
   kubectl get pods -l app.kubernetes.io/name=postgresql
   ```

2. Проверьте переменные окружения в backend:

   ```bash
   kubectl exec -it <backend-pod> -- env | grep DB_
   ```

3. Проверьте логи PostgreSQL:
   ```bash
   kubectl logs postgresql-0
   ```

### Таблицы не создаются

В development режиме TypeORM автоматически создает таблицы (synchronize: true).

В production нужно запустить миграции:

```bash
cd services/backend
pnpm run migration:run
```

## Дополнительная информация

Подробная документация: [database-setup.md](./database-setup.md)
