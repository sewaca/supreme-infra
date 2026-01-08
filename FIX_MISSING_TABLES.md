# Исправление: relation "users" does not exist

## Проблема

```
QueryFailedError: relation "users" does not exist
```

Backend подключается к PostgreSQL, но таблицы не существуют.

## Причина

`init.sql` скрипт был обновлен и теперь включает CREATE TABLE, но PostgreSQL уже запущен со старым скриптом (или без него).

**Важно**: PostgreSQL выполняет init scripts только при **первом запуске** контейнера. Если контейнер уже был запущен, скрипт не выполнится повторно.

## Решение

Нужно пересоздать PostgreSQL с новым `init.sql` скриптом.

### Шаг 1: Удалите старую БД

```bash
# Через GitHub Actions: Deploy Database
# Service: backend
# Action: uninstall
```

Или через kubectl (если настроен):

```bash
kubectl delete statefulset postgresql-backend -n default
kubectl delete service postgresql-backend -n default
```

### Шаг 2: Удалите PVC (важно!)

**⚠️ Это удалит все данные!**

```bash
kubectl delete pvc data-postgresql-backend-0 -n default
```

Это необходимо, потому что:

- PVC содержит старые данные PostgreSQL
- При новом запуске PostgreSQL увидит существующие данные и НЕ запустит init.sql
- Нужно удалить PVC чтобы PostgreSQL начал с чистого листа

### Шаг 3: Закоммитьте изменения

```bash
git add infra/databases/backend-db/init.sql
git add infra/overrides/production/postgresql-backend.yaml
git commit -m "fix: add CREATE TABLE statements to init.sql"
git push
```

### Шаг 4: Задеплойте PostgreSQL заново

```bash
# Через GitHub Actions: Deploy Database
# Service: backend
# Action: install
```

Теперь PostgreSQL:

1. Запустится с пустым volume
2. Увидит что данных нет
3. Выполнит `init.sql` скрипт
4. Создаст таблицы `users` и `recipe_likes`
5. Вставит начальных пользователей

### Шаг 5: Перезапустите backend

```bash
kubectl rollout restart deployment/backend -n default
```

Или просто подождите пока backend сам переподключится.

## Проверка

### 1. Проверить что таблицы созданы

```bash
kubectl exec postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db -c "\dt"
```

Должно показать:

```
              List of relations
 Schema |     Name      | Type  |    Owner
--------+---------------+-------+--------------
 public | recipe_likes  | table | backend_user
 public | users         | table | backend_user
```

### 2. Проверить пользователей

```bash
kubectl exec postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db \
  -c "SELECT email, name, role FROM users;"
```

Должно показать 3 пользователя:

```
       email        |      name       |    role
--------------------+-----------------+------------
 admin@example.com  | Admin User      | admin
 moder@example.com  | Moderator User  | moderator
 user@example.com   | Regular User    | user
```

### 3. Проверить логи backend

```bash
kubectl logs deployment/backend -n default --tail=20
```

НЕ должно быть ошибок "relation does not exist".

## Что было исправлено в init.sql

### Было (только INSERT):

```sql
INSERT INTO users (email, password, name, role, created_at) VALUES
  ('admin@example.com', '...', 'Admin User', 'admin', NOW())
ON CONFLICT (email) DO NOTHING;
```

### Стало (CREATE TABLE + INSERT):

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create recipe_likes table
CREATE TABLE IF NOT EXISTS recipe_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);

-- Insert initial users
INSERT INTO users (email, password, name, role, created_at) VALUES
  ('admin@example.com', '...', 'Admin User', 'admin', NOW())
ON CONFLICT (email) DO NOTHING;
```

## Альтернативный способ (если не хотите удалять PVC)

Если у вас уже есть важные данные в БД, можно создать таблицы вручную:

```bash
# Подключитесь к БД
kubectl exec -it postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db

# Выполните SQL из init.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);

-- Вставьте пользователей
INSERT INTO users (email, password, name, role, created_at) VALUES
  ('admin@example.com', '$2b$10$Nkntdhghajml3edGWucny.xSRRLId2nv70E7hKzvjEQsythcN.ZpC', 'Admin User', 'admin', NOW()),
  ('moder@example.com', '$2b$10$RnWxr3HzK4KVuAv854g/k.AiwlFKaT/NDQQuulMkF1EzxvqNsmxn6', 'Moderator User', 'moderator', NOW()),
  ('user@example.com', '$2b$10$4INUj5alxEjHmoM/szXUBeIMDLowl42WnqOxJoULh.3qDFmnj/e9.', 'Regular User', 'user', NOW())
ON CONFLICT (email) DO NOTHING;

-- Выйдите
\q
```

## Важно помнить

1. ✅ `init.sql` выполняется только при первом запуске PostgreSQL
2. ✅ Если volume уже содержит данные - скрипт НЕ выполнится
3. ✅ Чтобы применить новый `init.sql` - нужно удалить PVC
4. ✅ После обновления `init.sql` - запустите `pnpm run generate`
5. ✅ Закоммитьте изменения перед деплоем
