# Конфигурация секретов для баз данных

## Обзор

Каждый сервис с базой данных может использовать свой собственный GitHub Secret для пароля БД. Это настраивается в `services.yaml`.

## Настройка в services.yaml

```yaml
services:
  nest:
    - name: backend
      description: Backend service (NestJS)
      database:
        enabled: true
        name: backend_db
        user: backend_user
        passwordSecret: DB_PASSWORD # Название GitHub Secret
```

### Параметры database

| Параметр         | Обязательный | По умолчанию     | Описание                         |
| ---------------- | ------------ | ---------------- | -------------------------------- |
| `enabled`        | Да           | -                | Включить БД для сервиса          |
| `name`           | Нет          | `{service}_db`   | Имя базы данных                  |
| `user`           | Нет          | `{service}_user` | Имя пользователя БД              |
| `passwordSecret` | Нет          | `DB_PASSWORD`    | Название GitHub Secret с паролем |

## Как это работает

### 1. Деплой базы данных

Workflow `deploy-database.yml` использует секрет `DB_PASSWORD` для создания PostgreSQL:

```bash
helm install postgresql-backend ./infra/helmcharts/postgresql \
  --set database.password="$DB_PASSWORD"
```

### 2. Деплой backend сервиса

Workflow `cd.yml` автоматически:

1. **Читает `services.yaml`** и определяет какой секрет использовать
2. **Получает значение** из GitHub Secrets
3. **Передает в Helm** как переменную окружения `DB_PASSWORD`

```yaml
# Автоматически генерируется workflow
- name: Get database password secret name
  run: |
    DB_SECRET=$(yq eval ".services.nest[] | select(.name == \"$SERVICE_NAME\") | .database.passwordSecret" services.yaml)
    echo "secret_name=$DB_SECRET" >> $GITHUB_OUTPUT

- name: Deploy with Helm
  with:
    db-password: ${{ secrets[steps.get-db-secret.outputs.secret_name] }}
```

### 3. Backend подключается к БД

Backend получает пароль через переменную окружения `DB_PASSWORD`:

```typescript
// app.module.ts
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    host: configService.get("DB_HOST"),
    password: configService.get("DB_PASSWORD"), // ← из secrets
  }),
});
```

## Примеры использования

### Один секрет для всех сервисов

```yaml
services:
  nest:
    - name: backend
      database:
        enabled: true
        passwordSecret: DB_PASSWORD # ← общий секрет

    - name: auth-service
      database:
        enabled: true
        passwordSecret: DB_PASSWORD # ← тот же секрет
```

**GitHub Secrets:**

- `DB_PASSWORD`: `my_secure_password_123`

### Разные секреты для разных сервисов

```yaml
services:
  nest:
    - name: backend
      database:
        enabled: true
        passwordSecret: BACKEND_DB_PASSWORD

    - name: auth-service
      database:
        enabled: true
        passwordSecret: AUTH_DB_PASSWORD

    - name: analytics
      database:
        enabled: true
        passwordSecret: ANALYTICS_DB_PASSWORD
```

**GitHub Secrets:**

- `BACKEND_DB_PASSWORD`: `backend_pass_123`
- `AUTH_DB_PASSWORD`: `auth_pass_456`
- `ANALYTICS_DB_PASSWORD`: `analytics_pass_789`

### Использование по умолчанию

Если не указать `passwordSecret`, будет использоваться `DB_PASSWORD`:

```yaml
services:
  nest:
    - name: backend
      database:
        enabled: true
        # passwordSecret не указан → используется DB_PASSWORD
```

## Настройка GitHub Secrets

### Добавление секрета

1. Перейдите в **Settings** → **Secrets and variables** → **Actions**
2. Нажмите **New repository secret**
3. Name: `DB_PASSWORD` (или другое имя из `services.yaml`)
4. Value: ваш безопасный пароль
5. Нажмите **Add secret**

### Генерация безопасного пароля

```bash
# Генерация 32-символьного пароля
openssl rand -base64 32

# Или с использованием pwgen
pwgen -s 32 1
```

### Требования к паролю

- ✅ Минимум 16 символов
- ✅ Используйте буквы, цифры и спецсимволы
- ✅ Не используйте простые слова
- ✅ Разные пароли для разных окружений
- ❌ Не коммитьте пароли в Git

## Обновление пароля

### Для PostgreSQL

1. Обновите секрет в GitHub
2. Запустите workflow **Deploy Database** с action `upgrade`
3. PostgreSQL обновит пароль

### Для backend сервиса

1. Обновите секрет в GitHub
2. Запустите workflow **Create Release Pipeline**
3. Backend перезапустится с новым паролем

### Важно!

⚠️ **Пароли должны совпадать!**

PostgreSQL и backend должны использовать **один и тот же** секрет:

```yaml
# services.yaml
database:
  passwordSecret: DB_PASSWORD # ← backend использует этот секрет


# deploy-database.yml также использует DB_PASSWORD
```

Если вы измените пароль только в одном месте, подключение к БД сломается.

## Troubleshooting

### Ошибка: password authentication failed

**Причина**: Пароли в PostgreSQL и backend не совпадают.

**Решение**:

1. Проверьте что секрет установлен в GitHub
2. Убедитесь что используется правильное имя секрета в `services.yaml`
3. Пересоздайте БД с правильным паролем:
   ```bash
   # Удалите старую БД
   kubectl delete pvc data-postgresql-backend-0 -n default
   ```
4. Задеплойте БД заново с правильным паролем

### Ошибка: Secret not found

**Причина**: Секрет с указанным именем не существует в GitHub.

**Решение**:

1. Проверьте имя секрета в `services.yaml`
2. Добавьте секрет в GitHub Settings → Secrets
3. Убедитесь что имя написано точно так же (case-sensitive)

### Проверка текущей конфигурации

```bash
# Посмотреть какой секрет использует сервис
yq eval '.services.nest[] | select(.name == "backend") | .database.passwordSecret' services.yaml

# Проверить переменные окружения в pod
kubectl exec deployment/backend -n default -- env | grep DB_
```

## Best Practices

### 1. Используйте разные пароли для production и development

```yaml
# Для production используйте сильные пароли
passwordSecret: PROD_DB_PASSWORD

# Для development можно использовать более простые
# (но все равно не коммитьте их в Git!)
```

### 2. Ротация паролей

Регулярно меняйте пароли (например, раз в 3-6 месяцев):

1. Создайте новый секрет с временным именем
2. Обновите БД с новым паролем
3. Обновите backend с новым паролем
4. Удалите старый секрет

### 3. Документируйте используемые секреты

Создайте файл `SECRETS.md` в корне проекта:

```markdown
# GitHub Secrets

## Database Passwords

- `DB_PASSWORD` - используется для backend БД
- `AUTH_DB_PASSWORD` - используется для auth-service БД

## Other Secrets

- `JWT_SECRET` - для JWT токенов
```

### 4. Используйте разные секреты для критичных сервисов

```yaml
services:
  nest:
    - name: backend
      database:
        passwordSecret: BACKEND_DB_PASSWORD # ← отдельный секрет

    - name: payment-service
      database:
        passwordSecret: PAYMENT_DB_PASSWORD # ← отдельный секрет для платежей!
```

## Дополнительные ресурсы

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [PostgreSQL Password Authentication](https://www.postgresql.org/docs/current/auth-password.html)
- [TypeORM Connection Options](https://typeorm.io/data-source-options)
