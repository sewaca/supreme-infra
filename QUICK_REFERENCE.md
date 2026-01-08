# Быстрая справка по базе данных

## 🎯 Частые проблемы и решения

### Проблема 1: Password authentication failed

```
Error: password authentication failed for user "backend_user"
```

**Причина**: Backend не может подключиться к PostgreSQL, потому что пароли не совпадают.

**Решение**: См. раздел "Решение" ниже.

### Проблема 2: Relation "users" does not exist

```
QueryFailedError: relation "users" does not exist
```

**Причина**: Таблицы не созданы. `init.sql` не выполнился или был без CREATE TABLE.

**Решение**: См. [FIX_MISSING_TABLES.md](FIX_MISSING_TABLES.md) для детальной инструкции.

**Быстрое решение**:
1. Удалите PostgreSQL через workflow (action: uninstall)
2. Удалите PVC: `kubectl delete pvc data-postgresql-backend-0 -n default`
3. Закоммитьте изменения в `init.sql`
4. Задеплойте PostgreSQL заново (action: install)

### Решение

1. **Проверьте секрет в GitHub**:
   - Settings → Secrets → Actions
   - Должен быть секрет `DB_PASSWORD` со значением `fake_pass` (или другим)

2. **Пересоздайте PostgreSQL**:

   ```bash
   # Через GitHub Actions: Deploy Database
   # Service: backend
   # Action: uninstall

   # Затем удалите PVC
   kubectl delete pvc data-postgresql-backend-0 -n default

   # Затем установите заново
   # Action: install
   ```

3. **Перезапустите backend**:
   ```bash
   kubectl rollout restart deployment/backend -n default
   ```

## 📋 Как настроен пароль

### В services.yaml

```yaml
database:
  passwordSecret: DB_PASSWORD # ← имя GitHub Secret
```

### Workflow автоматически

1. Читает `passwordSecret` из `services.yaml`
2. Получает значение из `secrets.DB_PASSWORD`
3. Передает в PostgreSQL и backend

## ✅ Проверка что все работает

```bash
# 1. Проверить что PostgreSQL запущен
kubectl get pods -n default | grep postgresql
# Должно быть: postgresql-backend-0   1/1   Running

# 2. Проверить что backend запущен
kubectl get pods -n default | grep backend
# Должно быть: backend-xxx   1/1   Running

# 3. Проверить логи backend
kubectl logs deployment/backend -n default --tail=20
# Должно быть: "Database connection established" или подобное
# НЕ должно быть: "password authentication failed"

# 4. Проверить переменные окружения
kubectl exec deployment/backend -n default -- env | grep DB_
# Должно показать:
# DB_HOST=postgresql-backend
# DB_PORT=5432
# DB_NAME=backend_db
# DB_USER=backend_user
# DB_PASSWORD=fake_pass

# 5. Проверить данные в БД
kubectl exec postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db \
  -c "SELECT email, role FROM users;"
# Должно показать 3 пользователя
```

## 🔧 Полезные команды

### Подключиться к БД

```bash
kubectl exec -it postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db
```

### Посмотреть все таблицы

```sql
\dt
```

### Посмотреть пользователей

```sql
SELECT * FROM users;
```

### Выйти из psql

```sql
\q
```

## 🚀 Деплой

### Деплой PostgreSQL

```bash
# GitHub Actions → Deploy Database
Service: backend
Action: install  # первый раз
Action: upgrade  # обновление конфигурации
Action: uninstall  # удаление
```

### Деплой Backend

```bash
# GitHub Actions → Create Release Pipeline
Service: backend
```

## 📚 Документация

| Что нужно          | Где найти                                |
| ------------------ | ---------------------------------------- |
| Быстрая настройка  | `DATABASE_PASSWORD_SETUP.md`             |
| Полный обзор       | `DATABASE_CONFIGURATION_SUMMARY.md`      |
| Гайд по деплою     | `DEPLOY_DATABASE_GUIDE.md`               |
| Настройка секретов | `docs/database-secrets-configuration.md` |

## ⚠️ Важно помнить

1. ✅ PostgreSQL и backend в одном namespace (`default`)
2. ✅ Используют один и тот же секрет `DB_PASSWORD`
3. ✅ `init.sql` выполняется только при первом запуске
4. ✅ `upgrade` безопасен - не удаляет данные
5. ✅ Можно использовать разные секреты для разных сервисов
