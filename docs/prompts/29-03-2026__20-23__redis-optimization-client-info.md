# План: общий Redis-кэш для supreme-infra

## Контекст

Сейчас в инфраструктуре нет кэширования. Каждый сервис при необходимости получить данные о пользователе делает HTTP-запрос к `core-client-info`. С появлением сервиса сообщений (core-messages) количество таких запросов вырастет на порядок — каждое отображение чата требует данных о нескольких пользователях (аватар, имя).

**Цель**: добавить общий Redis-кэш, доступный всем сервисам, для быстрого доступа к часто запрашиваемым данным.

---

## Что кэшировать

| Данные                                           | Источник           | TTL            | Ключ                             | Приоритет   |
| ------------------------------------------------ | ------------------ | -------------- | -------------------------------- | ----------- |
| Профиль пользователя (name, avatar, group, role) | core-client-info   | 1 час          | `user:{user_id}`                 | Высокий     |
| Список групп                                     | core-client-info   | 6 часов        | `groups:all`                     | Средний     |
| Пользователи по группе                           | core-client-info   | 1 час          | `group:{group_name}:users`       | Средний     |
| Online-статус                                    | core-messages (WS) | 5 мин          | `online:{user_id}`               | Низкий (v2) |
| Rate limiting                                    | per-service        | sliding window | `ratelimit:{user_id}:{endpoint}` | Низкий (v2) |

---

## Архитектура

### 1. Redis в Kubernetes

Новый Helm chart `infra/helmcharts/redis/`:

```yaml
# values.yaml
image:
  repository: redis
  tag: "7-alpine"

persistence:
  enabled: true
  size: 2Gi

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

service:
  type: ClusterIP
  port: 6379

# Redis config
config:
  maxmemory: 256mb
  maxmemory-policy: allkeys-lru # LRU eviction — кэш, не хранилище
```

Service DNS: `redis.default.svc.cluster.local:6379`

### 2. Для локальной разработки

Добавить в `docker-compose.dev.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: supreme-redis-dev
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

### 3. Shared Python-пакет: `cache-py`

Новый пакет `packages/cache-py/` по аналогии с `packages/authorization-py/`:

```
packages/cache-py/
  cache_py/
    __init__.py
    client.py         # Redis client singleton
    user_cache.py     # Кэширование пользователей
    decorators.py     # @cached decorator для произвольных функций
  pyproject.toml
```

#### client.py

```python
import redis.asyncio as redis
from functools import lru_cache

@lru_cache
def get_redis_client(redis_url: str = "redis://redis.default.svc.cluster.local:6379") -> redis.Redis:
    return redis.from_url(redis_url, decode_responses=True)
```

#### user_cache.py

```python
import json
from uuid import UUID
from .client import get_redis_client

USER_TTL = 3600  # 1 час
USER_PREFIX = "user:"

async def get_cached_user(user_id: UUID, redis_url: str = None) -> dict | None:
    r = get_redis_client(redis_url) if redis_url else get_redis_client()
    data = await r.get(f"{USER_PREFIX}{user_id}")
    return json.loads(data) if data else None

async def set_cached_user(user_id: UUID, data: dict, redis_url: str = None) -> None:
    r = get_redis_client(redis_url) if redis_url else get_redis_client()
    await r.setex(f"{USER_PREFIX}{user_id}", USER_TTL, json.dumps(data, default=str))

async def get_cached_users_batch(user_ids: list[UUID], redis_url: str = None) -> dict[UUID, dict | None]:
    r = get_redis_client(redis_url) if redis_url else get_redis_client()
    keys = [f"{USER_PREFIX}{uid}" for uid in user_ids]
    values = await r.mget(keys)
    return {
        uid: json.loads(v) if v else None
        for uid, v in zip(user_ids, values)
    }

async def invalidate_user(user_id: UUID, redis_url: str = None) -> None:
    r = get_redis_client(redis_url) if redis_url else get_redis_client()
    await r.delete(f"{USER_PREFIX}{user_id}")
```

#### decorators.py

```python
import json
import functools
from .client import get_redis_client

def cached(prefix: str, ttl: int = 3600, key_func=None):
    """Декоратор для кэширования результатов async-функций."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            r = get_redis_client()
            cache_key = f"{prefix}:{key_func(*args, **kwargs)}" if key_func else f"{prefix}:{args}:{kwargs}"
            cached_value = await r.get(cache_key)
            if cached_value:
                return json.loads(cached_value)
            result = await func(*args, **kwargs)
            await r.setex(cache_key, ttl, json.dumps(result, default=str))
            return result
        return wrapper
    return decorator
```

Зависимости (`pyproject.toml`):

```toml
dependencies = ["redis[hiredis]>=5.0.0"]
```

### 4. Shared TypeScript-пакет: `@supreme-int/cache`

Новый пакет `packages/cache/` для NestJS и Next.js сервисов:

```
packages/cache/
  src/
    index.ts
    client.ts          # ioredis client
    user-cache.ts      # User caching functions
  package.json
  tsconfig.json
```

Зависимости: `ioredis`

### 5. Интеграция в core-client-info

**Write-through**: при обновлении профиля пользователя в core-client-info — записать в Redis.

В `app/routers/profile.py` добавить инвалидацию:

```python
# После обновления профиля
await invalidate_user(user_id)
```

В `app/routers/settings.py` — аналогично при изменении настроек.

### 6. Интеграция в core-messages

Заменить таблицу `user_cache` (PostgreSQL) на Redis-кэш:

1. При обогащении сообщений sender info — сначала Redis, потом core-client-info (miss)
2. При создании broadcast — кэшировать список пользователей группы
3. Убрать модель `UserCache` из ORM, убрать миграцию

### 7. Интеграция в WebSocket (online-статус)

При connect — `SETEX online:{user_id} 300 1` (5 мин TTL)
При получении любого WS-сообщения — обновить TTL
При disconnect — `DEL online:{user_id}`

Другие сервисы могут проверить: `EXISTS online:{user_id}`

---

## Конфигурация сервисов

Добавить env-переменную во все сервисы:

```env
REDIS_URL=redis://redis.default.svc.cluster.local:6379
```

В Helm values каждого сервиса:

```yaml
env:
  REDIS_URL: "redis://redis.default.svc.cluster.local:6379"
```

---

## Порядок внедрения

1. **Helm chart Redis** — деплой в K8s
2. **docker-compose** — добавить Redis для local dev
3. **cache-py** — shared пакет для Python-сервисов
4. **@supreme-int/cache** — shared пакет для TypeScript-сервисов
5. **core-client-info** — write-through при обновлении профиля
6. **core-messages** — заменить PostgreSQL user_cache на Redis
7. **Мониторинг** — Grafana dashboard для Redis (hit rate, memory, connections)

---

## Метрики для мониторинга

- `redis_cache_hits_total` / `redis_cache_misses_total` — hit rate
- `redis_cache_latency_ms` — время запроса к Redis
- `redis_memory_used_bytes` — потребление памяти
- `redis_connected_clients` — количество активных подключений

Добавить в OpenTelemetry через кастомные OTel-метрики в `cache-py` и `@supreme-int/cache`.

---

## Ожидаемый эффект

| Метрика                          | Без Redis            | С Redis           |
| -------------------------------- | -------------------- | ----------------- |
| Получение user info              | ~50ms (HTTP)         | ~1ms (Redis)      |
| Загрузка списка чатов (20 чатов) | ~200ms (20 HTTP)     | ~5ms (batch mget) |
| Нагрузка на core-client-info     | Линейно от сообщений | Только cache miss |

---

## Риски и ограничения

- **Redis — Single Point of Failure**: решается Redis Sentinel или кластером в production. Для MVP — standalone.
- **Согласованность кэша**: write-through в core-client-info + TTL 1 час. Данные могут быть устаревшими до 1 часа — для аватара/имени это допустимо.
- **Память**: LRU eviction с maxmemory 256MB. При 10K пользователей по ~500 байт = ~5MB. Огромный запас.
