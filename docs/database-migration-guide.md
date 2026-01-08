# Database Migration Guide

Руководство по миграции данных пользователей из памяти в PostgreSQL.

## Обзор изменений

### Было (In-Memory)

- Данные хранились в массиве `users` внутри `UsersService`
- Данные терялись при перезапуске приложения
- Невозможно масштабировать на несколько инстансов

### Стало (PostgreSQL + TypeORM)

- Данные хранятся в PostgreSQL базе данных
- Данные персистентны и не теряются при перезапуске
- Возможно масштабирование на несколько инстансов backend

## Что изменилось в коде

### 1. Новые зависимости

Добавлены в `pnpm-workspace.yaml`:

```yaml
"@nestjs/typeorm": ^11.0.0
typeorm: ^0.3.20
pg: ^8.13.1
```

### 2. Entity классы

Созданы TypeORM entity классы:

- `UserEntity` - для таблицы users
- `RecipeLikeEntity` - для таблицы recipe_likes

Файл: `services/backend/src/features/Auth/model/entities/User.entity.ts`

### 3. UsersService

`UsersService` теперь использует TypeORM репозитории вместо массивов в памяти:

**Было:**

```typescript
private users: User[] = [...];
async findByEmail(email: string) {
  return this.users.find(user => user.email === email);
}
```

**Стало:**

```typescript
constructor(
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>,
) {}

async findByEmail(email: string) {
  return await this.userRepository.findOne({ where: { email } });
}
```

### 4. AppModule

Добавлена конфигурация TypeORM:

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: "postgres",
    host: configService.get<string>("DB_HOST", "localhost"),
    // ... другие настройки
  }),
});
```

### 5. Переменные окружения

Добавлены новые переменные в `service.yaml`:

- `DB_HOST` - хост PostgreSQL (по умолчанию: postgresql)
- `DB_PORT` - порт PostgreSQL (по умолчанию: 5432)
- `DB_NAME` - имя базы данных (по умолчанию: auth_db)
- `DB_USER` - пользователь БД (по умолчанию: auth_user)
- `DB_PASSWORD` - пароль БД (из секретов)

## Процесс миграции

### Шаг 1: Сохранить существующие данные (если нужно)

Если у вас есть важные данные пользователей в production, сначала экспортируйте их:

```bash
# Подключитесь к running backend pod
kubectl exec -it <backend-pod> -- node -e "
const users = /* ваш код для получения users */;
console.log(JSON.stringify(users, null, 2));
" > users-backup.json
```

### Шаг 2: Деплой PostgreSQL

```bash
# Development
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password=dev_password

# Production
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace production \
  --set database.password=$DB_PASSWORD
```

### Шаг 3: Обновить GitHub Secrets

Добавьте `DB_PASSWORD` в GitHub Secrets:

1. Перейдите в Settings -> Secrets and variables -> Actions
2. Нажмите "New repository secret"
3. Name: `DB_PASSWORD`
4. Value: ваш безопасный пароль

### Шаг 4: Установить зависимости локально

```bash
cd /path/to/supreme-infra
pnpm install
```

### Шаг 5: Деплой обновленного Backend

Создайте PR с изменениями и запустите release pipeline:

1. Merge PR в main
2. Запустите [Create Release Pipeline](https://github.com/sewaca/supreme-infra/actions/workflows/cd.yml)
3. Выберите service: backend
4. Дождитесь canary deployment
5. Проверьте логи и метрики
6. Approve для promotion в production

### Шаг 6: Импорт данных (если нужно)

Если вы сохранили данные на шаге 1, импортируйте их:

```bash
# Создайте SQL скрипт из JSON
cat users-backup.json | jq -r '.[] |
"INSERT INTO users (email, password, name, role, created_at) VALUES (\"\(.email)\", \"\(.password)\", \"\(.name)\", \"\(.role)\", \"\(.createdAt)\");"
' > import-users.sql

# Импортируйте в БД
kubectl exec -i postgresql-0 -- psql -U auth_user -d auth_db < import-users.sql
```

### Шаг 7: Проверка

```bash
# Проверьте, что пользователи в БД
kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "SELECT id, email, name, role FROM users;"

# Проверьте логи backend
kubectl logs -l app.kubernetes.io/name=backend --tail=100

# Попробуйте залогиниться через UI
# Используйте: admin@example.com / admin123
```

## Откат (Rollback)

Если что-то пошло не так, можно откатиться:

### Вариант 1: Откат через release pipeline

```bash
# Запустите CD pipeline с предыдущей версией
# В release_branch укажите: releases/production/backend-v{previous-version}
```

### Вариант 2: Ручной откат

```bash
# 1. Удалить PostgreSQL (если нужно)
helm uninstall postgresql --namespace default

# 2. Откатить backend на предыдущую версию
kubectl rollout undo deployment/backend

# 3. Проверить статус
kubectl rollout status deployment/backend
```

## Тестирование локально

Для локальной разработки:

```bash
# 1. Запустить PostgreSQL в Docker
docker run --name postgres-dev \
  -e POSTGRES_USER=auth_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=auth_db \
  -p 5432:5432 \
  -d postgres:16-alpine

# 2. Установить переменные окружения
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=auth_db
export DB_USER=auth_user
export DB_PASSWORD=dev_password
export JWT_SECRET=your-jwt-secret

# 3. Запустить backend
cd services/backend
pnpm run dev
```

## Troubleshooting

### Backend не может подключиться к БД

**Симптомы:**

```
Error: connect ECONNREFUSED postgresql:5432
```

**Решение:**

1. Проверьте, что PostgreSQL запущен:
   ```bash
   kubectl get pods -l app.kubernetes.io/name=postgresql
   ```
2. Проверьте переменные окружения:
   ```bash
   kubectl exec -it <backend-pod> -- env | grep DB_
   ```
3. Проверьте service:
   ```bash
   kubectl get svc postgresql
   ```

### Таблицы не создаются

**Симптомы:**

```
QueryFailedError: relation "users" does not exist
```

**Решение:**

В development (synchronize: true):

- Таблицы должны создаваться автоматически
- Проверьте логи backend на ошибки

В production (synchronize: false):

- Запустите миграции:
  ```bash
  cd services/backend
  pnpm run migration:run
  ```

### Ошибки миграции

**Симптомы:**

```
Migration failed: duplicate key value violates unique constraint
```

**Решение:**

1. Проверьте, что данные не дублируются
2. Очистите БД и запустите миграцию заново:
   ```bash
   kubectl exec -it postgresql-0 -- psql -U auth_user -d auth_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   cd services/backend
   pnpm run migration:run
   ```

### Потеря данных после перезапуска PostgreSQL

**Симптомы:**

- После перезапуска pod'а PostgreSQL данные пропадают

**Решение:**

1. Проверьте PVC:
   ```bash
   kubectl get pvc
   kubectl describe pvc data-postgresql-0
   ```
2. Убедитесь, что persistence.enabled: true в values.yaml
3. Проверьте, что StorageClass поддерживает ReadWriteOnce

## Дополнительные ресурсы

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

## Контрольный список миграции

- [ ] Сохранены существующие данные (если нужно)
- [ ] PostgreSQL задеплоен и работает
- [ ] DB_PASSWORD добавлен в GitHub Secrets
- [ ] Зависимости установлены (pnpm install)
- [ ] Backend обновлен через release pipeline
- [ ] Canary deployment проверен
- [ ] Promoted в production
- [ ] Данные импортированы (если нужно)
- [ ] Проверена авторизация через UI
- [ ] Настроены автоматические бэкапы
- [ ] Обновлена документация команды

## Поддержка

Если возникли проблемы:

1. Проверьте логи: `kubectl logs -l app.kubernetes.io/name=backend`
2. Проверьте PostgreSQL: `kubectl logs postgresql-0`
3. Проверьте connectivity: `kubectl exec -it <backend-pod> -- nc -zv postgresql 5432`
4. Обратитесь к [database-setup.md](./database-setup.md) для детальной информации
