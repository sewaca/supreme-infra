# Database Deployment Workflow

GitHub Actions workflow для деплоя PostgreSQL баз данных в Kubernetes кластер.

## Обзор

Workflow `deploy-database.yml` позволяет:

- ✅ Устанавливать PostgreSQL для любого сервиса с включенной БД
- 🔄 Обновлять существующие базы данных
- 🗑️ Удалять базы данных
- 🎯 Деплой в default namespace
- ✅ Автоматически валидировать конфигурацию
- 📊 Проверять подключение после деплоя

## Использование

### Запуск workflow

1. Перейдите в **Actions** → **Deploy Database**
2. Нажмите **Run workflow**
3. Выберите параметры:
   - **service** - сервис для деплоя БД
   - **action** - действие (install/upgrade/uninstall)

### Параметры

#### service

Выбор сервиса для деплоя базы данных. Список автоматически генерируется из `services.yaml`.

Доступны только сервисы с `database.enabled: true`.

#### action

- **install** - установить новую БД (ошибка если уже существует)
  - Создает новый StatefulSet, PVC, Service
  - Применяет `init.sql` для создания таблиц и начальных данных
  - Используется один раз при первом запуске БД

- **upgrade** - обновить существующую БД или установить если не существует
  - Обновляет конфигурацию (resources, env variables)
  - **НЕ** перезаписывает данные (PVC остается нетронутым)
  - **НЕ** запускает `init.sql` повторно
  - Безопасно для изменения настроек без потери данных

- **uninstall** - удалить БД (⚠️ удалит все данные!)
  - Удаляет StatefulSet, Service
  - **УДАЛЯЕТ PVC и все данные**
  - Используется для полной очистки или пересоздания БД

Все деплои выполняются в **default** namespace.

## Примеры использования

### Первичная установка

```yaml
service: backend
action: install
```

Результат:

- Создается release `postgresql-backend` в namespace `default`
- Используются values из `infra/overrides/production/postgresql-backend.yaml`
- Применяется `init.sql` скрипт для создания таблиц и начальных данных
- Пароль берется из secret `DB_PASSWORD`

### Обновление конфигурации

После изменения values файла:

```yaml
service: backend
action: upgrade
```

Результат:

- Обновляется существующий release с новыми values
- Данные сохраняются (благодаря PersistentVolume)
- `init.sql` НЕ применяется повторно

### Удаление БД

⚠️ **Внимание**: Это удалит все данные!

```yaml
service: backend
action: uninstall
```

Результат:

- Удаляется release `postgresql-backend`
- PVC остается (нужно удалить вручную если требуется)

## Workflow Steps

### 1. Validate Service Configuration

Проверяет:

- ✅ Сервис существует в `services.yaml`
- ✅ У сервиса `database.enabled: true`
- ✅ Получает `db_name` и `db_user` из конфигурации

Если валидация не прошла - workflow останавливается с ошибкой.

### 2. Deploy Database

Выполняет выбранное действие:

#### Install

```bash
helm install postgresql-backend ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password="$DB_PASSWORD" \
  -f infra/overrides/production/postgresql-backend.yaml \
  --wait --timeout 5m
```

#### Upgrade

```bash
helm upgrade postgresql-backend ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password="$DB_PASSWORD" \
  -f infra/overrides/production/postgresql-backend.yaml \
  --wait --timeout 5m
```

Если release не существует - автоматически выполняет install.

#### Uninstall

```bash
helm uninstall postgresql-backend --namespace default --wait
```

### 3. Verify Deployment

После install/upgrade:

- ✅ Ждет готовности pod (timeout 120s)
- ✅ Проверяет подключение к БД
- ✅ Выводит информацию о деплое

### 4. Post-Deployment Info

Выводит полезную информацию:

- 📊 Connection details
- 📝 Next steps
- 🔍 Useful commands

## Секреты

### DB_PASSWORD

**Обязательный** secret для всех окружений.

Добавление:

1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `DB_PASSWORD`
4. Value: ваш безопасный пароль

**Рекомендации:**

- Используйте разные пароли для development и production
- Минимум 16 символов
- Используйте генератор паролей

```bash
# Генерация безопасного пароля
openssl rand -base64 32
```

### Другие секреты

Workflow также использует:

- `YC_SA_JSON_CREDENTIALS` - Yandex Cloud service account
- `YC_CLOUD_ID` - Yandex Cloud ID
- `YC_FOLDER_ID` - Yandex Cloud folder ID
- `YC_K8S_CLUSTER_ID` - Kubernetes cluster ID

## Namespace

Все базы данных деплоятся в **default** namespace:

- Namespace: `default`
- Resources: см. values в `infra/overrides/production/`

Это позволяет backend сервисам легко подключаться к БД по простому DNS-имени `postgresql-{service}`.

## Автоматическое обновление

Список сервисов в workflow автоматически обновляется при запуске:

```bash
pnpm run generate
```

Генератор `update-database-workflow`:

1. Читает `services.yaml`
2. Находит все сервисы с `database.enabled: true`
3. Обновляет список в `deploy-database.yml`

## Добавление нового сервиса

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

### 2. Создайте структуру БД

```bash
mkdir -p infra/databases/new-service-db/migrations
# Создайте data-source.ts и README.md
```

### 3. Запустите генератор

```bash
pnpm run generate
```

Это автоматически:

- ✅ Добавит `new-service` в список workflow
- ✅ Создаст values файлы для БД
- ✅ Обновит overrides сервиса

### 4. Задеплойте БД

Запустите workflow через GitHub Actions UI.

## Troubleshooting

### Ошибка: Service does not have database enabled

**Причина**: В `services.yaml` для сервиса `database.enabled: false` или не указано.

**Решение**:

```yaml
services:
  nest:
    - name: my-service
      database:
        enabled: true # ← добавьте это
```

Затем запустите `pnpm run generate`.

### Ошибка: Values file not found

**Причина**: Не сгенерированы values файлы для БД.

**Решение**:

```bash
pnpm run generate
git add infra/overrides/
git commit -m "chore: generate database values"
git push
```

### Ошибка: Release already exists (при install)

**Причина**: БД уже установлена.

**Решение**: Используйте action `upgrade` вместо `install`.

### Pod не запускается

**Проверка**:

```bash
# Посмотреть статус
kubectl get pods -l app.kubernetes.io/name=postgresql -n default

# Посмотреть события
kubectl describe pod postgresql-backend-0 -n default

# Посмотреть логи
kubectl logs postgresql-backend-0 -n default
```

**Частые причины**:

1. Недостаточно ресурсов в кластере
2. PVC не может быть создан (проблемы с StorageClass)
3. Неправильный пароль в secret

### Timeout при деплое

**Причина**: Pod не становится ready за 5 минут.

**Решение**:

1. Проверьте ресурсы кластера
2. Проверьте PVC: `kubectl get pvc -n default`
3. Увеличьте timeout в workflow (если нужно)

## Мониторинг

### Проверка статуса БД

```bash
# Статус pod
kubectl get pods -l app.kubernetes.io/name=postgresql -n default

# Статус PVC
kubectl get pvc -n default

# Логи
kubectl logs -f postgresql-backend-0 -n default
```

### Подключение к БД

```bash
# Из кластера
kubectl exec -it postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db

# Port-forward для локального доступа
kubectl port-forward postgresql-backend-0 5432:5432 -n default
psql -h localhost -U backend_user -d backend_db
```

### Проверка размера БД

```bash
kubectl exec postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db \
  -c "SELECT pg_size_pretty(pg_database_size('backend_db'));"
```

## Backup и Restore

### Создание бэкапа через workflow

После деплоя используйте команды из output:

```bash
kubectl exec postgresql-backend-0 -n default -- \
  pg_dump -U backend_user backend_db > backup-$(date +%Y%m%d).sql
```

### Восстановление

```bash
kubectl exec -i postgresql-backend-0 -n default -- \
  psql -U backend_user backend_db < backup.sql
```

### Автоматические бэкапы

Рекомендуется настроить CronJob для автоматических бэкапов:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgresql-backup
spec:
  schedule: "0 2 * * *" # Каждый день в 2:00
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16-alpine
              command:
                - /bin/sh
                - -c
                - pg_dump -h postgresql-backend -U backend_user backend_db >
                  /backup/backup-$(date +%Y%m%d-%H%M%S).sql
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgresql-backend-secret
                      key: POSTGRES_PASSWORD
              volumeMounts:
                - name: backup
                  mountPath: /backup
          volumes:
            - name: backup
              persistentVolumeClaim:
                claimName: postgresql-backups
          restartPolicy: OnFailure
```

## Best Practices

### 1. Используйте upgrade по умолчанию

`upgrade` безопаснее чем `install` - он работает в обоих случаях (новая установка или обновление).

### 2. Тестируйте в development

Всегда сначала деплойте в development, проверяйте, затем в production.

### 3. Делайте бэкапы перед upgrade

```bash
# Перед upgrade в production
kubectl exec postgresql-backend-0 -n production -- \
  pg_dump -U backend_user backend_db > backup-before-upgrade.sql
```

### 4. Мониторьте ресурсы

Следите за использованием CPU, Memory и Disk:

```bash
kubectl top pod postgresql-backend-0 -n default
```

### 5. Настройте алерты

Настройте алерты в Grafana на:

- Высокое использование CPU/Memory
- Заполнение диска
- Недоступность БД

## Дополнительные ресурсы

- [Database Setup Guide](./database-setup.md)
- [Adding New Database](./adding-new-database.md)
- [PostgreSQL Helm Chart](../infra/helmcharts/postgresql/README.md)
- [Generator Documentation](../infra/generate/update-database-workflow/)
