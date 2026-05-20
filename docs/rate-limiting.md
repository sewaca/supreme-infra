# Rate Limiting — supreme-infra

## Обзор

Защита от брутфорса и DDoS реализована на двух уровнях:

1. **Nginx Ingress** — сетевой уровень, первая линия защиты
2. **Приложение (core-auth)** — бизнес-логика, защита конкретных эндпоинтов

---

## 1. Nginx Ingress — защита от DDoS

**Файлы:**
- `infra/helmcharts/ingress-nginx/templates/ingress.yaml`
- `infra/helmcharts/ingress-nginx/values.yaml`

### Конфигурация

В `values.yaml` для `core-auth` задан жёсткий лимит на уровне ingress:

```yaml
- service: core-auth
  port: 80
  rateLimit:
    rps: 3              # максимум 3 запроса в секунду с одного IP
    burstMultiplier: 1  # burst = rps * burstMultiplier = 3 (нет послабления)
```

Nginx возвращает `429 Too Many Requests` при превышении (`limit-req-status-code: "429"`).

### Применяемые аннотации (ingress.yaml)

```yaml
nginx.ingress.kubernetes.io/limit-rps:              "3"
nginx.ingress.kubernetes.io/limit-connections:      <значение>
nginx.ingress.kubernetes.io/limit-burst-multiplier: "1"
nginx.ingress.kubernetes.io/limit-whitelist:        <доверенные IP>
```

Лимит применяется ко **всем эндпоинтам** `core-auth`:
- `POST /core-auth/auth/login`
- `POST /core-auth/auth/register`
- `GET  /core-auth/auth/lookup`
- `GET  /core-auth/auth/me`
- `POST /core-auth/auth/validate-session`

### Как работает

```
Client IP → Nginx Ingress → [limit_req_zone] → core-auth pod
                                  ↓ (>3 rps)
                               429 Too Many Requests
```

Nginx отрезает избыточные запросы **до попадания в приложение**, разгружая бэкенд при флуде.

---

## 2. core-auth — Application-Level Rate Limiting

Реализован поверх Redis. Все счётчики хранятся в Redis с TTL, что гарантирует корректную работу при горизонтальном масштабировании.

### 2.1 Защита Login от брутфорса

**Файл:** `services/core-auth/app/brute_force.py`  
**Эндпоинт:** `POST /core-auth/auth/login`

#### Параметры

```python
MAX_ATTEMPTS = 5          # попыток с неверным паролем
LOCKOUT_SECONDS = 900     # блокировка = 15 минут
```

#### Алгоритм

1. Запрос приходит → проверяем Redis-ключ `login_lock:{email}`
2. Если ключ есть → `429` с заголовком `Retry-After: <секунд до разблокировки>`
3. Если пароль **неверный** → `record_failed_attempt(email)`:
   - инкрементируем счётчик в Redis
   - при достижении `MAX_ATTEMPTS` — устанавливаем ключ блокировки с TTL 900 сек
4. При **успешном** входе → сбрасываем счётчик

```
POST /login (wrong password) × 5
        ↓
  Redis: login_lock:user@example.com = 1, TTL=900s
        ↓
  POST /login → 429 Too Many Requests
  Retry-After: 847
```

### 2.2 Защита Lookup от перебора email

**Файл:** `services/core-auth/app/brute_force.py`  
**Эндпоинт:** `GET /core-auth/auth/lookup`

Lookup позволяет проверить, существует ли email в системе. Без лимита злоумышленник может перебрать базу пользователей.

#### Параметры

```python
MAX_LOOKUP_ATTEMPTS = 10       # запросов с одного IP
LOOKUP_LOCKOUT_SECONDS = 900   # блокировка = 15 минут
```

#### Алгоритм

Счётчик привязан к **IP-адресу** клиента (не к email):

```
Redis key: lookup_lock:{client_ip}
```

При превышении 10 запросов за 15 минут — `429` с `Retry-After`.

### 2.3 Защита Challenge Verify (сброс пароля)

**Файл:** `services/core-auth/app/models/challenge.py`  
**Эндпоинты:**
- `POST /core-auth/auth/challenge/{challenge_id}/verify`
- `POST /core-auth/auth/forgot-password/{challenge_id}/verify`

#### Параметры

```python
MAX_ATTEMPTS = 3          # попыток на один challenge
CHALLENGE_TTL_MINUTES = 10
```

Счётчик хранится в **базе данных** (поле `attempts` в записи challenge). Challenge живёт 10 минут, после исчерпания попыток — помечается недействительным.

```
POST /challenge/{id}/verify (wrong code) × 3
        ↓
  challenge.attempts = 3 → challenge invalidated
        ↓
  POST /challenge/{id}/verify → 429 (attempts exhausted)
```

---

## 3. Сводная таблица

| Эндпоинт | Уровень | Лимит | Механизм | Хранилище |
|----------|---------|-------|----------|-----------|
| Все эндпоинты core-auth | Nginx | 3 req/s с IP | `limit_req_zone` | Nginx shared memory |
| `POST /auth/login` | App | 5 неверных попыток → блок 15 мин | Sliding counter | Redis |
| `GET /auth/lookup` | App | 10 запросов/15 мин с IP | Sliding counter | Redis |
| `POST /challenge/*/verify` | App | 3 попытки на challenge | Attempt counter | PostgreSQL |
| `POST /forgot-password/*/verify` | App | 3 попытки на challenge | Attempt counter | PostgreSQL |

---

## 4. Ответы при превышении лимитов

Все rate-limited ответы возвращают:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: <seconds>
Content-Type: application/json

{"detail": "Too many requests. Try again in <N> seconds."}
```

Заголовок `Retry-After` позволяет клиенту корректно реализовать retry-логику без polling.

---

## 5. Архитектурная схема

```
Internet
    │
    ▼
Nginx Ingress ──── [3 req/s per IP] ──── 429 (DDoS protection)
    │
    ▼
core-auth (FastAPI)
    │
    ├── POST /auth/login
    │       └── Redis: [5 attempts / 15 min per email] ──── 429
    │
    ├── GET /auth/lookup
    │       └── Redis: [10 req / 15 min per IP] ──────────── 429
    │
    └── POST /challenge/*/verify
            └── DB: [3 attempts per challenge] ─────────── 429
```

Двухслойная защита: Nginx отсекает флуд на сетевом уровне, приложение защищает бизнес-логику от целевых атак.
