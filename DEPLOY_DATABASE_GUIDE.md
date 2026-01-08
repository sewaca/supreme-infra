# Быстрый гайд: Деплой PostgreSQL для backend

## Текущая ситуация

- ✅ Backend запущен в namespace `default`
- ❌ PostgreSQL был в namespace `production` (теперь исправлено)
- ✅ Теперь PostgreSQL будет деплоиться в `default` namespace

## Что нужно сделать

### 1. Удалить старую БД из production namespace (если она там есть)

Запустите GitHub Action "Deploy Database":
- Service: `backend`
- Action: `uninstall`

Затем вручную удалите PVC (если нужно):
```bash
kubectl delete pvc data-postgresql-backend-0 -n production
```

### 2. Задеплоить БД в default namespace

Запустите GitHub Action "Deploy Database":
- Service: `backend`
- Action: `install` (или `upgrade` если не уверены)

### 3. Проверить что БД запустилась

```bash
kubectl get pods -n default | grep postgresql
kubectl logs postgresql-backend-0 -n default
```

### 4. Проверить подключение backend к БД

```bash
kubectl logs -f deployment/backend -n default
```

Должны увидеть успешное подключение к PostgreSQL.

## DNS-имя для подключения

Backend подключается к БД по имени: `postgresql-backend`

Это работает, потому что оба сервиса теперь в одном namespace (`default`).

Полное DNS-имя: `postgresql-backend.default.svc.cluster.local`

## Проверка данных

После успешного подключения проверьте что начальные пользователи созданы:

```bash
kubectl exec -it postgresql-backend-0 -n default -- \
  psql -U backend_user -d backend_db -c "SELECT email, name, role FROM users;"
```

Должны увидеть 3 пользователя:
- admin@example.com (admin)
- moder@example.com (moderator)
- user@example.com (user)

## Troubleshooting

### Ошибка: ENOTFOUND postgresql-backend

**Причина**: БД не запущена или в другом namespace.

**Решение**: Убедитесь что PostgreSQL pod запущен в namespace `default`:
```bash
kubectl get pods -n default | grep postgresql
```

### Ошибка: password authentication failed

**Причина**: Неправильный пароль в secret `DB_PASSWORD`.

**Решение**: Проверьте что secret установлен в GitHub:
- Settings → Secrets and variables → Actions
- Должен быть secret `DB_PASSWORD`

### Pod не запускается

**Причина**: Возможно недостаточно ресурсов или проблемы с PVC.

**Решение**:
```bash
kubectl describe pod postgresql-backend-0 -n default
kubectl get pvc -n default
```

