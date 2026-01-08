# Быстрая настройка пароля БД

## Текущая конфигурация

В `services.yaml` указано:

```yaml
services:
  nest:
    - name: backend
      database:
        enabled: true
        passwordSecret: DB_PASSWORD # ← используется этот GitHub Secret
```

## Что нужно сделать

### 1. Убедитесь что секрет установлен в GitHub

1. Перейдите в **Settings** → **Secrets and variables** → **Actions**
2. Проверьте что есть секрет `DB_PASSWORD`
3. Если его нет - создайте:
   - Name: `DB_PASSWORD`
   - Value: ваш пароль (например: `fake_pass`)

### 2. Задеплойте PostgreSQL с этим паролем

Запустите GitHub Action "Deploy Database":

- Service: `backend`
- Action: `install` (или `upgrade` если уже установлена)

PostgreSQL получит пароль из секрета `DB_PASSWORD`.

### 3. Задеплойте backend с этим же паролем

Запустите GitHub Action "Create Release Pipeline":

- Service: `backend`

Backend автоматически:

1. Прочитает из `services.yaml` что нужен секрет `DB_PASSWORD`
2. Получит значение из GitHub Secrets
3. Подключится к PostgreSQL с этим паролем

## Как работает передача пароля

```
services.yaml
    ↓
    passwordSecret: DB_PASSWORD
    ↓
GitHub Actions читает эту настройку
    ↓
Получает значение из secrets.DB_PASSWORD
    ↓
Передает в Helm как --set secrets.DB_PASSWORD="..."
    ↓
Helm создает Secret в Kubernetes
    ↓
Backend читает DB_PASSWORD из env
    ↓
Подключается к PostgreSQL
```

## Проверка

### Проверить что секрет используется правильно

```bash
# Посмотреть какой секрет настроен для backend
yq eval '.services.nest[] | select(.name == "backend") | .database.passwordSecret' services.yaml
# Вывод: DB_PASSWORD

# Проверить переменные окружения в pod
kubectl exec deployment/backend -n default -- env | grep DB_PASSWORD
# Должно показать: DB_PASSWORD=fake_pass
```

### Проверить подключение к БД

```bash
# Посмотреть логи backend
kubectl logs deployment/backend -n default --tail=50

# Если видите "Connected to database" - все работает!
# Если видите "password authentication failed" - пароли не совпадают
```

## Использование разных секретов для разных сервисов

Если у вас несколько сервисов с БД, можно использовать разные секреты:

```yaml
services:
  nest:
    - name: backend
      database:
        passwordSecret: BACKEND_DB_PASSWORD # ← свой секрет

    - name: auth-service
      database:
        passwordSecret: AUTH_DB_PASSWORD # ← свой секрет
```

Тогда в GitHub Secrets нужно создать оба:

- `BACKEND_DB_PASSWORD`
- `AUTH_DB_PASSWORD`

## Troubleshooting

### Ошибка: password authentication failed

**Решение**: Пересоздайте БД с правильным паролем:

1. Удалите старую БД:
   - GitHub Actions → Deploy Database
   - Service: `backend`, Action: `uninstall`

2. Удалите PVC:

   ```bash
   kubectl delete pvc data-postgresql-backend-0 -n default
   ```

3. Проверьте секрет в GitHub Settings

4. Задеплойте БД заново:
   - GitHub Actions → Deploy Database
   - Service: `backend`, Action: `install`

5. Перезапустите backend:
   ```bash
   kubectl rollout restart deployment/backend -n default
   ```

## Полная документация

См. [docs/database-secrets-configuration.md](docs/database-secrets-configuration.md)
