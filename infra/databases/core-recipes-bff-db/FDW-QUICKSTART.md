# FDW Quick Start Guide

Быстрая инструкция по настройке Foreign Data Wrapper для синхронизации с `core-auth-bff-db`.

## TL;DR

```bash
# 1. Задеплоить обе БД
kubectl apply -f infra/databases/core-auth-bff-db/
kubectl apply -f infra/databases/core-recipes-bff-db/

# 2. Дождаться готовности
kubectl wait --for=condition=ready pod -l app=postgresql-core-auth-bff --timeout=300s
kubectl wait --for=condition=ready pod -l app=postgresql-core-recipes-bff --timeout=300s

# 3. Настроить FDW credentials
kubectl apply -f infra/databases/core-recipes-bff-db/k8s-fdw-setup-job.yaml

# 4. Проверить
kubectl logs job/setup-fdw-credentials
```

## Что это даёт?

✅ Автоматическая валидация `user_id` при вставке/обновлении  
✅ JOIN-запросы с таблицей `users` из другой БД  
✅ Views для удобного доступа к данным пользователей  
✅ Нет дублирования данных между БД  

## Проверка работы

```bash
# Подключиться к БД
kubectl exec -it postgresql-core-recipes-bff-0 -- \
  psql -U core_recipes_bff_user -d core_recipes_bff_db

# Проверить доступ к foreign table
SELECT id, email, name, role FROM users LIMIT 5;

# Проверить view с JOIN
SELECT * FROM published_recipes_with_users LIMIT 5;
```

## Локальная разработка

Для Docker Compose:

```bash
# 1. Запустить обе БД
docker-compose up -d postgres-core-auth-bff postgres-core-recipes-bff

# 2. Настроить FDW
docker exec -it postgres-core-recipes-bff psql -U postgres -d core_recipes_bff_db << 'EOF'
DROP USER MAPPING IF EXISTS FOR CURRENT_USER SERVER auth_server;
CREATE USER MAPPING FOR CURRENT_USER SERVER auth_server 
  OPTIONS (user 'postgres', password 'postgres');
EOF

# 3. Проверить
docker exec -it postgres-core-recipes-bff psql -U postgres -d core_recipes_bff_db -c "SELECT COUNT(*) FROM users;"
```

## Управление паролями

### Рекомендация: Один пароль для обеих БД

В `services.yaml`:

```yaml
services:
  nest:
    - name: core-auth-bff
      database:
        passwordSecret: DB_PASSWORD  # ← один секрет
    
    - name: core-recipes-bff
      database:
        passwordSecret: DB_PASSWORD  # ← тот же секрет
```

### Если используются разные пароли

Обновите `k8s-fdw-setup-job.yaml`:

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgresql-core-recipes-bff-secret
        key: password
  - name: AUTH_DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgresql-core-auth-bff-secret
        key: password  # ← отдельный пароль
```

## Troubleshooting

### Job не запускается

```bash
# Проверить статус Job
kubectl describe job setup-fdw-credentials

# Проверить логи
kubectl logs job/setup-fdw-credentials

# Удалить и пересоздать
kubectl delete job setup-fdw-credentials
kubectl apply -f infra/databases/core-recipes-bff-db/k8s-fdw-setup-job.yaml
```

### Ошибка "could not connect to server"

Проверьте:
1. Обе БД запущены и ready
2. Сетевая связность между БД
3. Правильность credentials в secrets

```bash
# Проверить БД
kubectl get pods | grep postgresql

# Проверить secrets
kubectl get secrets | grep postgresql

# Проверить сеть
kubectl exec -it postgresql-core-recipes-bff-0 -- \
  nc -zv postgresql-core-auth-bff 5432
```

### Ошибка "permission denied"

Credentials неправильные. Обновите user mapping:

```bash
# Получить правильный пароль
AUTH_PASS=$(kubectl get secret postgresql-core-auth-bff-secret -o jsonpath='{.data.password}' | base64 -d)

# Обновить вручную
kubectl exec -it postgresql-core-recipes-bff-0 -- \
  psql -U core_recipes_bff_user -d core_recipes_bff_db << EOF
DROP USER MAPPING IF EXISTS FOR CURRENT_USER SERVER auth_server;
CREATE USER MAPPING FOR CURRENT_USER SERVER auth_server 
  OPTIONS (user 'core_auth_bff_user', password '$AUTH_PASS');
EOF
```

## Дополнительная документация

- **FDW-SETUP.md** - полная документация по FDW
- **TEST-FDW.sql** - тестовый скрипт для проверки
- **setup-fdw-credentials.sql** - скрипт для ручного обновления credentials

## Примеры использования

### В SQL

```sql
-- Рецепты с авторами
SELECT 
  r.id,
  r.title,
  u.name as author_name,
  u.email as author_email
FROM published_recipes r
LEFT JOIN users u ON r.author_user_id = u.id
WHERE r.difficulty = 'easy';

-- Или через view
SELECT * FROM published_recipes_with_users WHERE difficulty = 'easy';
```

### В TypeORM

```typescript
// Через raw query
const recipes = await this.dataSource.query(`
  SELECT * FROM published_recipes_with_users 
  WHERE author_user_id = $1
`, [userId]);

// Или через QueryBuilder (если настроить entity для view)
const recipes = await this.publishedRecipesWithUsersRepository
  .createQueryBuilder('r')
  .where('r.author_user_id = :userId', { userId })
  .getMany();
```

