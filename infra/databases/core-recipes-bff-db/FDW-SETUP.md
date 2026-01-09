# Foreign Data Wrapper (FDW) Setup

## Описание

База данных `core-recipes-bff-db` использует PostgreSQL Foreign Data Wrapper (FDW) для доступа к таблице `users` из базы данных `core-auth-bff-db`. Это позволяет:

1. **Валидировать `user_id`** при вставке/обновлении записей
2. **Делать JOIN-запросы** с таблицей пользователей
3. **Избежать дублирования данных** между базами

## Архитектура

```
┌─────────────────────────┐         ┌─────────────────────────┐
│  core-auth-bff-db       │         │  core-recipes-bff-db    │
│                         │         │                         │
│  ┌─────────────────┐    │         │  ┌─────────────────┐    │
│  │ users (real)    │◄───┼─────────┼──│ users (foreign) │    │
│  │ - id            │    │   FDW   │  │ - id            │    │
│  │ - email         │    │         │  │ - email         │    │
│  │ - name          │    │         │  │ - name          │    │
│  │ - role          │    │         │  │ - role          │    │
│  └─────────────────┘    │         │  └─────────────────┘    │
│                         │         │           │             │
└─────────────────────────┘         │           ▼             │
                                    │  ┌─────────────────┐    │
                                    │  │ published_      │    │
                                    │  │   recipes       │    │
                                    │  │ - author_user_id│    │
                                    │  └─────────────────┘    │
                                    │  ┌─────────────────┐    │
                                    │  │ proposed_       │    │
                                    │  │   recipes       │    │
                                    │  │ - author_user_id│    │
                                    │  └─────────────────┘    │
                                    │  ┌─────────────────┐    │
                                    │  │ recipe_likes    │    │
                                    │  │ - user_id       │    │
                                    │  └─────────────────┘    │
                                    └─────────────────────────┘
```

## Настройка

### 1. Автоматическая настройка (init.sql)

FDW частично настраивается автоматически при инициализации базы данных через `init.sql`:

```sql
-- Включение расширения
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Создание сервера
CREATE SERVER auth_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'postgres-core-auth-bff', port '5432', dbname 'core_auth_bff');

-- Маппинг пользователя (с placeholder паролем)
CREATE USER MAPPING FOR CURRENT_USER
  SERVER auth_server
  OPTIONS (user 'core_auth_bff_user', password 'changeme');

-- Импорт таблицы users
IMPORT FOREIGN SCHEMA public LIMIT TO (users)
  FROM SERVER auth_server INTO public;
```

**⚠️ Важно:** Пароль в user mapping устанавливается как placeholder и должен быть обновлён после деплоя!

### 2. Обновление credentials после деплоя

#### Вариант A: Kubernetes Job (рекомендуется)

Используйте готовый Kubernetes Job для автоматической настройки:

```bash
# Применить Job
kubectl apply -f infra/databases/core-recipes-bff-db/k8s-fdw-setup-job.yaml

# Проверить статус
kubectl get jobs setup-fdw-credentials
kubectl logs job/setup-fdw-credentials

# Для повторного запуска
kubectl delete job setup-fdw-credentials
kubectl apply -f infra/databases/core-recipes-bff-db/k8s-fdw-setup-job.yaml
```

Job автоматически:
1. Ждёт готовности обеих БД
2. Получает пароли из Kubernetes secrets
3. Обновляет user mapping с правильными credentials
4. Тестирует подключение

#### Вариант B: Ручная настройка

Для ручного обновления credentials:

```bash
# Получить пароль из secret
AUTH_DB_PASSWORD=$(kubectl get secret postgresql-core-auth-bff-secret -o jsonpath='{.data.password}' | base64 -d)

# Выполнить скрипт настройки
kubectl exec -it postgresql-core-recipes-bff-0 -- \
  psql -U core_recipes_bff_user -d core_recipes_bff_db \
  -v auth_user="core_auth_bff_user" \
  -v auth_password="$AUTH_DB_PASSWORD" \
  -f /docker-entrypoint-initdb.d/setup-fdw-credentials.sql
```

#### Вариант C: Локальная разработка

Для локальной разработки с Docker Compose:

```bash
# Подключиться к БД recipes
docker exec -it postgres-core-recipes-bff psql -U postgres -d core_recipes_bff_db

# Обновить user mapping
DROP USER MAPPING IF EXISTS FOR CURRENT_USER SERVER auth_server;
CREATE USER MAPPING FOR CURRENT_USER SERVER auth_server 
  OPTIONS (user 'postgres', password 'postgres');

-- Проверить
SELECT COUNT(*) FROM users;
```

### 3. Проверка настройки

Подключитесь к базе данных и выполните:

```sql
-- Проверить, что foreign server создан
SELECT * FROM pg_foreign_server WHERE srvname = 'auth_server';

-- Проверить, что foreign table создана
SELECT * FROM information_schema.foreign_tables WHERE foreign_table_name = 'users';

-- Проверить доступ к данным
SELECT id, email, name, role FROM users LIMIT 5;
```

## Использование

### 1. Валидация user_id

Триггеры автоматически проверяют существование пользователя:

```sql
-- ✅ Успешно (если пользователь с id=1 существует)
INSERT INTO recipe_likes (user_id, recipe_id) VALUES (1, 100);

-- ❌ Ошибка: User with id 999999 does not exist
INSERT INTO recipe_likes (user_id, recipe_id) VALUES (999999, 100);
```

### 2. JOIN-запросы с пользователями

Используйте готовые views:

```sql
-- Рецепты с информацией об авторах
SELECT * FROM published_recipes_with_users WHERE author_user_id = 1;

-- Лайки с информацией о пользователях
SELECT * FROM recipe_likes_with_users WHERE recipe_id = 100;
```

Или делайте JOIN напрямую:

```sql
SELECT 
  r.id,
  r.title,
  u.name as author_name,
  u.email as author_email
FROM published_recipes r
LEFT JOIN users u ON r.author_user_id = u.id
WHERE r.difficulty = 'easy';
```

### 3. Проверка существования пользователя

```sql
-- Проверить, существует ли пользователь
SELECT EXISTS(SELECT 1 FROM users WHERE id = 123);

-- Получить информацию о пользователе
SELECT id, email, name, role FROM users WHERE id = 123;
```

## Views

Созданы следующие views для удобства:

### `published_recipes_with_users`
Рецепты с данными авторов:
- Все поля из `published_recipes`
- `author_email`, `author_name`, `author_role` из `users`

### `proposed_recipes_with_users`
Предложенные рецепты с данными авторов:
- Все поля из `proposed_recipes`
- `author_email`, `author_name`, `author_role` из `users`

### `recipe_comments_with_users`
Комментарии с данными авторов:
- Все поля из `recipe_comments`
- `author_email`, `author_name`, `author_role` из `users`

### `recipe_likes_with_users`
Лайки с данными пользователей:
- Все поля из `recipe_likes`
- `user_email`, `user_name`, `user_role` из `users`

## Производительность

### Индексы

На стороне `core-auth-bff-db` должен быть индекс на `users.id` (создаётся автоматически как PRIMARY KEY).

На стороне `core-recipes-bff-db` созданы индексы:
- `idx_published_recipes_author_user_id`
- `idx_proposed_recipes_author_user_id`
- `idx_recipe_comments_author_user_id`
- `idx_recipe_likes_user_id`

### Кэширование

PostgreSQL кэширует результаты запросов к foreign tables. Для принудительного обновления:

```sql
-- Очистить кэш для конкретной foreign table
ALTER FOREIGN TABLE users OPTIONS (SET use_remote_estimate 'true');
```

## Ограничения

1. **Нельзя создать FOREIGN KEY** на foreign table
   - Решение: используем триггеры для валидации

2. **Производительность JOIN-запросов** может быть ниже
   - Решение: используйте индексы и EXPLAIN ANALYZE для оптимизации

3. **Транзакции** не распространяются между базами
   - Решение: используйте distributed transactions (2PC) при необходимости

4. **Изменение данных** в foreign table требует прав
   - По умолчанию настроен только SELECT доступ

## Управление паролями

### Где хранятся пароли?

#### Kubernetes (Production/Staging)

Пароли хранятся в Kubernetes Secrets:

```bash
# Просмотр secrets
kubectl get secrets | grep postgresql

# Получить пароль для core-recipes-bff
kubectl get secret postgresql-core-recipes-bff-secret -o jsonpath='{.data.password}' | base64 -d

# Получить пароль для core-auth-bff
kubectl get secret postgresql-core-auth-bff-secret -o jsonpath='{.data.password}' | base64 -d
```

#### GitHub Secrets

Пароли задаются через GitHub Secrets и передаются в Helm при деплое:

- `DB_PASSWORD` - для core-recipes-bff
- `AUTH_DB_PASSWORD` - для core-auth-bff (может быть тот же `DB_PASSWORD`)

См. документацию: `docs/database-secrets-configuration.md`

#### Docker Compose (Local Development)

В `docker-compose.dev.yml`:

```yaml
environment:
  POSTGRES_PASSWORD: postgres  # или dev_password
```

### Обновление паролей

#### 1. Обновить пароль в БД

```bash
# Подключиться к БД
kubectl exec -it postgresql-core-auth-bff-0 -- psql -U postgres

# Обновить пароль
ALTER USER core_auth_bff_user WITH PASSWORD 'new_password';
```

#### 2. Обновить Kubernetes Secret

```bash
# Обновить secret
kubectl create secret generic postgresql-core-auth-bff-secret \
  --from-literal=password='new_password' \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### 3. Обновить FDW User Mapping

```bash
# Запустить Job заново
kubectl delete job setup-fdw-credentials
kubectl apply -f infra/databases/core-recipes-bff-db/k8s-fdw-setup-job.yaml
```

### Синхронизация паролей между БД

**Рекомендация:** Используйте один и тот же пароль для обеих БД в одном окружении.

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

Это упрощает FDW setup, так как обе БД используют одинаковый пароль.

## Troubleshooting

### Ошибка: "could not connect to server"

Проверьте:
1. Доступность `postgres-core-auth-bff` из `postgres-core-recipes-bff`
2. Правильность credentials в USER MAPPING
3. Сетевые настройки Docker/Kubernetes

```sql
-- Проверить настройки сервера
SELECT * FROM pg_foreign_server WHERE srvname = 'auth_server';

-- Проверить user mapping
SELECT * FROM pg_user_mappings WHERE srvname = 'auth_server';
```

### Ошибка: "permission denied"

Обновите credentials:

```sql
ALTER USER MAPPING FOR CURRENT_USER
  SERVER auth_server
  OPTIONS (SET user 'correct_user', SET password 'correct_password');
```

### Медленные запросы

Используйте EXPLAIN ANALYZE:

```sql
EXPLAIN ANALYZE
SELECT * FROM published_recipes_with_users WHERE author_user_id = 1;
```

## Альтернативы

Если FDW не подходит, рассмотрите:

1. **Логическая репликация** - реплицировать таблицу `users` целиком
2. **Application-level sync** - синхронизация через API
3. **Event-driven sync** - синхронизация через message queue (Kafka, RabbitMQ)

## Дополнительные ресурсы

- [PostgreSQL FDW Documentation](https://www.postgresql.org/docs/current/postgres-fdw.html)
- [Foreign Data Wrappers Tutorial](https://wiki.postgresql.org/wiki/Foreign_data_wrappers)

