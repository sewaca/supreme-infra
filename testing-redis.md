# Deploy & Test Checklist

## 1. Что деплоить и в каком порядке

### Шаг 1 — Redis (GitHub Actions → Deploy Redis)

- Запустить `Deploy Redis` с `redis_target = redis-client-info-cache`
- Дождаться `ping` в логах

### Шаг 2 — core-client-info

- Новые эндпоинты: `GET /profile/users/search`, `GET /subjects/choices-with-priorities`
- Новый модуль: Redis-кэш пользователей

### Шаг 3 — core-messages

- Убрана таблица `user_cache` — зависит от Redis и нового эндпоинта поиска
- Если таблица существует в БД — дропнуть вручную: `DROP TABLE user_cache;`

### Шаг 4 — web-profile-ssr

- Страница `/profile/subjects-ranking` использует новый эндпоинт

---

## 2. Что проверить

### Redis

```bash
kubectl exec -n default redis-client-info-cache-0 -- redis-cli ping
# → PONG
```

### core-client-info

**Кэш работает:**

```bash
# 1. Сделать запрос к /profile/user
# 2. Проверить ключ в Redis
kubectl exec -n default redis-client-info-cache-0 -- \
  redis-cli get "user_profile:550e8400-e29b-41d4-a716-446655440000"
# → JSON с name/last_name/email/...
```

**Инвалидация при смене email:**

```
POST /core-client-info/settings/email
→ ключ user_profile:{id} должен исчезнуть из Redis
```

**Новый поиск:**

```
GET /core-client-info/profile/users/search?q=Иван&limit=10
→ 200, массив пользователей
```

**Новый combined endpoint:**

```
GET /core-client-info/subjects/choices-with-priorities?user_id={uuid}
→ 200, массив с полями subjects[] + user_priorities[]
```

### core-messages

**Поиск пользователей:**

```
GET /core-messages/users/search?q=Иван
→ 200, результаты из core-client-info (не из БД)
```

**Получение пользователя:**

```
GET /core-messages/users/{uuid}
→ 200, данные из Redis (проверить в логах: нет строк "Failed to fetch")
```

**Таблица удалена:**

```sql
SELECT * FROM information_schema.tables WHERE table_name = 'user_cache';
-- 0 rows
```

### web-profile-ssr

**Страница subjects-ranking:**

- Открыть `/profile/subjects-ranking`
- В Network DevTools / серверных логах: **1 запрос** к `choices-with-priorities` вместо 2+N
- Порядок предметов сохранён (priorities применились)

---

## Локальная проверка (docker-compose)

```bash
docker compose -f docker-compose.dev.yml up redis-client-info-cache -d
redis-cli -p 6380 ping  # → PONG

# Запустить core-client-info с REDIS_CACHE_URL=redis://localhost:6380
# Запустить core-messages с REDIS_CACHE_URL=redis://localhost:6380
```
