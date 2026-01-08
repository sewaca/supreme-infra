# Database Init Scripts

Руководство по использованию init scripts для автоматической инициализации PostgreSQL баз данных.

## Обзор

Init scripts - это SQL файлы, которые автоматически выполняются PostgreSQL при первом запуске контейнера. Они используются для:

- Создания начальных данных (seed data)
- Настройки прав доступа
- Создания дополнительных объектов БД

## Как это работает

1. **Создаете** `init.sql` в `infra/databases/{service}-db/`
2. **Запускаете** `pnpm run generate`
3. **Деплоите** БД через workflow или Helm

PostgreSQL автоматически выполнит скрипт при первом запуске.

## Структура

```
infra/
└── databases/
    └── backend-db/
        ├── init.sql          # ← Init script
        ├── data-source.ts    # TypeORM config (для reference)
        └── README.md
```

## Пример init.sql

```sql
-- Initial users for backend database
-- This script is executed automatically when PostgreSQL starts for the first time

-- Insert initial users (only if they don't exist)
INSERT INTO users (email, password, name, role, created_at) VALUES
  ('admin@example.com', '$2b$10$...', 'Admin User', 'admin', NOW()),
  ('moder@example.com', '$2b$10$...', 'Moderator User', 'moderator', NOW()),
  ('user@example.com', '$2b$10$...', 'Regular User', 'user', NOW())
ON CONFLICT (email) DO NOTHING;
```

## Важные моменты

### 1. Идемпотентность

Скрипт должен быть идемпотентным (можно запускать многократно):

```sql
-- ✅ Хорошо: использует ON CONFLICT
INSERT INTO users (email, name) VALUES ('admin@example.com', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- ✅ Хорошо: проверяет существование
INSERT INTO users (email, name)
SELECT 'admin@example.com', 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- ❌ Плохо: упадет при повторном запуске
INSERT INTO users (email, name) VALUES ('admin@example.com', 'Admin');
```

### 2. Порядок выполнения

PostgreSQL выполняет скрипты из `/docker-entrypoint-initdb.d/` в алфавитном порядке.

Если нужно несколько скриптов:

```
init-01-schema.sql
init-02-data.sql
init-03-indexes.sql
```

### 3. Только при первом запуске

Init scripts выполняются **только** если директория данных пуста (первый запуск).

Если нужно обновить данные в существующей БД - используйте миграции или выполните SQL вручную.

## Генерация values

Генератор автоматически читает `init.sql` и добавляет его в Helm values:

```bash
pnpm run generate
```

**Результат** в `infra/overrides/development/postgresql-backend.yaml`:

```yaml
initScript: >+
  -- Initial users for backend database
  -- This script is executed automatically...

  INSERT INTO users (email, password, name, role, created_at) VALUES
    ('admin@example.com', '$2b$10$...', 'Admin User', 'admin', NOW()),
    ...
  ON CONFLICT (email) DO NOTHING;

```

## Деплой

### Через Workflow

```yaml
service: backend
environment: development
action: install
```

Init script будет автоматически применен.

### Через Helm

```bash
helm install postgresql-backend ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password=dev_password \
  -f infra/overrides/development/postgresql-backend.yaml
```

## Обновление init script

### 1. Редактируйте init.sql

```sql
-- Добавьте новые данные
INSERT INTO roles (name) VALUES ('superadmin')
ON CONFLICT (name) DO NOTHING;
```

### 2. Запустите генератор

```bash
pnpm run generate
```

### 3. Закоммитьте изменения

```bash
git add infra/databases/backend-db/init.sql
git add infra/overrides/
git commit -m "feat: add superadmin role to init script"
```

### 4. Для существующих БД

Init script **не применится** к существующим БД автоматически.

Варианты:

**A. Пересоздать БД (development)**

```bash
# Удалить БД
helm uninstall postgresql-backend --namespace default
kubectl delete pvc data-postgresql-backend-0 -n default

# Установить заново
# Через workflow или helm install
```

**B. Применить вручную (production)**

```bash
# Подключиться к БД
kubectl exec -it postgresql-backend-0 -n production -- \
  psql -U backend_user -d backend_db

# Выполнить новые команды
INSERT INTO roles (name) VALUES ('superadmin')
ON CONFLICT (name) DO NOTHING;
```

## Примеры использования

### Создание lookup таблиц

```sql
-- init.sql
-- Create lookup tables
INSERT INTO statuses (id, name) VALUES
  (1, 'pending'),
  (2, 'active'),
  (3, 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name) VALUES
  (1, 'user'),
  (2, 'moderator'),
  (3, 'admin')
ON CONFLICT (id) DO NOTHING;
```

### Настройка расширений

```sql
-- init.sql
-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### Seed data для тестирования

```sql
-- init.sql (только для development)
-- Test data
INSERT INTO products (name, price) VALUES
  ('Product 1', 10.00),
  ('Product 2', 20.00),
  ('Product 3', 30.00)
ON CONFLICT DO NOTHING;
```

## Разные скрипты для окружений

Если нужны разные данные для development и production:

### Вариант 1: Условия в SQL

```sql
-- init.sql
-- Production users
INSERT INTO users (email, name, role) VALUES
  ('admin@example.com', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Development test users (только если не production)
-- Можно использовать переменные окружения через psql
```

### Вариант 2: Разные файлы

```
infra/databases/backend-db/
├── init.sql              # Общие данные
├── init-dev.sql          # Development данные
└── init-prod.sql         # Production данные
```

Обновите генератор для поддержки разных файлов.

## Мониторинг выполнения

### Проверка, что скрипт выполнился

```bash
# Посмотреть логи PostgreSQL
kubectl logs postgresql-backend-0 -n default | grep "init.sql"

# Проверить данные
kubectl exec -it postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db -c "SELECT COUNT(*) FROM users;"
```

### Логи выполнения

PostgreSQL логирует выполнение init scripts:

```
LOG:  database system is ready to accept connections
LOG:  running /docker-entrypoint-initdb.d/init.sql
```

## Best Practices

### 1. Используйте транзакции

```sql
BEGIN;

INSERT INTO users ...;
INSERT INTO roles ...;

COMMIT;
```

### 2. Добавляйте комментарии

```sql
-- Purpose: Create initial admin user
-- Date: 2026-01-08
-- Author: DevOps Team

INSERT INTO users ...;
```

### 3. Проверяйте синтаксис

```bash
# Локально проверить SQL
psql -U postgres -d test_db -f init.sql --dry-run
```

### 4. Версионируйте изменения

```sql
-- Version: 1.0.0
-- Initial users

-- Version: 1.1.0
-- Added superadmin role
```

### 5. Используйте переменные

```sql
-- Используйте переменные окружения PostgreSQL
\set admin_email 'admin@example.com'

INSERT INTO users (email) VALUES (:'admin_email');
```

## Troubleshooting

### Init script не выполняется

**Причина**: БД уже инициализирована (директория данных не пуста).

**Решение**: Пересоздайте БД или примените скрипт вручную.

### Ошибка в init script

**Симптомы**: PostgreSQL не запускается, в логах ошибка SQL.

**Решение**:

1. Посмотрите логи:

   ```bash
   kubectl logs postgresql-backend-0 -n default
   ```

2. Исправьте init.sql

3. Пересоздайте БД:
   ```bash
   helm uninstall postgresql-backend
   kubectl delete pvc data-postgresql-backend-0
   helm install ...
   ```

### Скрипт выполняется слишком долго

**Причина**: Большой объем данных или сложные запросы.

**Решение**:

1. Оптимизируйте SQL
2. Разбейте на несколько файлов
3. Увеличьте timeout в readiness probe

## Дополнительные ресурсы

- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres) - документация по init scripts
- [Database Setup Guide](./database-setup.md)
- [Adding New Database](./adding-new-database.md)
