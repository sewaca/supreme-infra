# Database Deployment Workflow - Quick Reference

## 🚀 Быстрый старт

### 1. Запуск через GitHub Actions

1. Перейдите в **Actions** → **Deploy Database**
2. Нажмите **Run workflow**
3. Выберите параметры и запустите

### 2. Параметры

| Параметр    | Описание             | Значения                      |
| ----------- | -------------------- | ----------------------------- |
| service     | Сервис для деплоя БД | backend (автообновляется)     |
| environment | Окружение            | development / production      |
| action      | Действие             | install / upgrade / uninstall |

## 📋 Типичные сценарии

### Первый деплой (Development)

```
service: backend
environment: development
action: install
```

**Результат**: PostgreSQL установлен в namespace `default`

### Первый деплой (Production)

```
service: backend
environment: production
action: install
```

**Результат**: PostgreSQL установлен в namespace `production` (требует approval)

### Обновление конфигурации

После изменения values файлов:

```
service: backend
environment: production
action: upgrade
```

**Результат**: Конфигурация обновлена, данные сохранены

### Удаление БД

⚠️ **Внимание**: Удалит все данные!

```
service: backend
environment: development
action: uninstall
```

## 🔧 Что делает workflow

### Install

1. ✅ Проверяет, что сервис имеет `database.enabled: true`
2. ✅ Устанавливает PostgreSQL через Helm
3. ✅ Ждет готовности pod (120s)
4. ✅ Проверяет подключение к БД
5. ✅ Выводит connection details

### Upgrade

1. ✅ Проверяет конфигурацию
2. ✅ Обновляет существующий release
3. ✅ Если release не существует - выполняет install
4. ✅ Проверяет подключение
5. ✅ Выводит информацию

### Uninstall

1. ✅ Проверяет существование release
2. ⚠️ Удаляет PostgreSQL
3. ℹ️ PVC остается (нужно удалить вручную)

## 📊 После деплоя

### Connection Details

```
Host: postgresql-backend.default.svc.cluster.local
Port: 5432
Database: backend_db
User: backend_user
Password: <from secret DB_PASSWORD>
```

### Полезные команды

```bash
# Подключиться к БД
kubectl exec -it postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db

# Проверить статус
kubectl get pods -l app.kubernetes.io/instance=postgresql-backend -n default

# Посмотреть логи
kubectl logs postgresql-backend-0 -n default

# Создать бэкап
kubectl exec postgresql-backend-0 -n default -- \
  pg_dump -U backend_user backend_db > backup.sql
```

## 🔐 Секреты

### Обязательный секрет: DB_PASSWORD

Добавьте в GitHub Secrets:

1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `DB_PASSWORD`
4. Value: ваш безопасный пароль

Генерация пароля:

```bash
openssl rand -base64 32
```

## 🆕 Добавление нового сервиса

### 1. Обновите services.yaml

```yaml
services:
  nest:
    - name: new-service
      database:
        enabled: true
        name: new_service_db
        user: new_service_user
```

### 2. Создайте структуру

```bash
mkdir -p infra/databases/new-service-db/migrations
# Создайте data-source.ts
```

### 3. Запустите генератор

```bash
pnpm run generate
```

**Результат**:

- ✅ `new-service` добавлен в workflow
- ✅ Созданы values файлы
- ✅ Обновлены overrides

### 4. Задеплойте через workflow

Запустите workflow с `service: new-service`

## ⚠️ Troubleshooting

### Ошибка: Service does not have database enabled

**Решение**: Добавьте `database.enabled: true` в `services.yaml` и запустите `pnpm run generate`

### Ошибка: Values file not found

**Решение**: Запустите `pnpm run generate` и закоммитьте изменения

### Ошибка: Release already exists

**Решение**: Используйте `action: upgrade` вместо `install`

### Pod не запускается

**Проверка**:

```bash
kubectl get pods -l app.kubernetes.io/name=postgresql -n default
kubectl describe pod postgresql-backend-0 -n default
kubectl logs postgresql-backend-0 -n default
```

## 📚 Дополнительная документация

- [Полная документация workflow](docs/database-deployment-workflow.md)
- [Настройка базы данных](docs/database-setup.md)
- [Добавление новой БД](docs/adding-new-database.md)

## 🎯 Best Practices

1. ✅ Используйте `upgrade` по умолчанию (работает для install и update)
2. ✅ Тестируйте в development перед production
3. ✅ Делайте бэкапы перед upgrade в production
4. ✅ Мониторьте ресурсы БД
5. ✅ Настройте автоматические бэкапы

## 🔄 Автоматическое обновление

Список сервисов в workflow обновляется автоматически при запуске:

```bash
pnpm run generate
```

Генератор находит все сервисы с `database.enabled: true` и обновляет workflow.

---

**Дата создания**: 2026-01-08  
**Версия**: 1.0.0  
**Статус**: ✅ Готово к использованию
