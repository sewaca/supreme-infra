# Quick Testing Guide

## Prerequisites

- **MinIO (or S3-compatible)** — bucket is created on startup via `ensure_bucket()`
- **core-auth** — JWT validation and session check for `/system-files-storage/upload`
- **core-messages** — после загрузки файла сервис регистрирует вложение через `POST {CORE_MESSAGES_URL}/files` (нужен ответ 200/201, иначе 502)

Отдельной БД у сервиса нет.

## Manual setup (for local development)

```bash
cd services/system-files-storage
cp .env.example .env
# при необходимости задайте S3_*, CORE_MESSAGES_URL, CORE_AUTH_URL (см. app/config.py и README.md)
uv sync
uv run uvicorn app.main:app --reload --port 8007
```

Локально пути приложения без префикса ingress: **`GET /status`**, **`POST /upload`**. Правило auth из `_auth_routes_generated.py` сопоставляется с **`/system-files-storage/upload`** — при запросе на **`/upload`** middleware не требует Bearer (для быстрых проверок без JWT).

## Quick Test Commands

### 1. Set up base URL

Публичный ingress для этого сервиса в репозитории объявлен для **`POST /system-files-storage/upload`**. Health-чек в Kubernetes бьёт во внутренний путь (см. `service.yaml`).

**Локально (прямой uvicorn):**

```bash
export BASE_URL="http://127.0.0.1:8007"
```

**Через ingress (пример):**

```bash
export BASE_URL="https://diploma.sewaca.ru/system-files-storage"
```

**Port-forward к сервису в кластере (проверка без публичного маршрута на status):**

```bash
kubectl port-forward -n supreme-infra svc/system-files-storage 8007:80
export BASE_URL="http://127.0.0.1:8007"
```

---

### Status

```bash
curl -s "$BASE_URL/status" | jq .
```

```json
{
  "status": "ok",
  "service": "system-files-storage"
}
```

---

### Получить JWT (через core-auth)

Токен нужен для **`POST .../system-files-storage/upload`** за ingress (путь совпадает с `AuthMiddleware`).

```bash
export CORE_AUTH_URL="https://diploma.sewaca.ru/core-auth"
export JWT_TOKEN=$(curl -s -X POST "$CORE_AUTH_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "ivan.ivanov@example.com", "password": "ivan.ivanov@example.com"}' | jq -r '.access_token')
```

Подставьте свой хост и тестового пользователя (см. `services/core-auth/TESTING.md`).

---

### Upload (multipart, 201)

Поля формы: **`file`**, **`conversation_id`**, **`message_id`** (оба UUID). Допустимые MIME: изображения (jpeg, png, gif, webp), PDF, doc/docx, plain text — см. `app/routers/upload.py`.

```bash
curl -s -X POST "$BASE_URL/upload" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F 'file=@./test.png;type=image/png' \
  -F 'conversation_id=123e4567-e89b-12d3-a456-426614174000' \
  -F 'message_id=223e4567-e89b-12d3-a456-426614174001' | jq .
```

За ingress с полным путём:

```bash
curl -s -X POST 'https://diploma.sewaca.ru/system-files-storage/upload' \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F 'file=@./test.png;type=image/png' \
  -F 'conversation_id=123e4567-e89b-12d3-a456-426614174000' \
  -F 'message_id=223e4567-e89b-12d3-a456-426614174001' | jq .
```

Пример успешного ответа:

```json
{
  "file_url": "https://…",
  "thumbnail_url": "https://…",
  "file_name": "test.png",
  "file_size": 1234,
  "mime_type": "image/png"
}
```

Чтобы получить **201**, сообщение с `message_id` должно существовать в **core-messages**, а пользователь из JWT — быть участником беседы; иначе регистрация вложения вернёт ошибку и этот сервис отдаст **502**.

---

### Upload — без Bearer (401), путь как за ingress

```bash
curl -s -X POST 'https://diploma.sewaca.ru/system-files-storage/upload' \
  -F 'file=@./test.png;type=image/png' \
  -F 'conversation_id=123e4567-e89b-12d3-a456-426614174000' \
  -F 'message_id=223e4567-e89b-12d3-a456-426614174001' | jq .
```

```json
{
  "detail": "Authentication required"
}
```

---

### Upload — неподдерживаемый тип (415)

```bash
curl -s -X POST "$BASE_URL/upload" \
  -F 'file=@./test.bin;type=application/octet-stream' \
  -F 'conversation_id=123e4567-e89b-12d3-a456-426614174000' \
  -F 'message_id=223e4567-e89b-12d3-a456-426614174001' | jq .
```

```json
{
  "detail": "Unsupported file type: application/octet-stream"
}
```

---

## Environment reference

| Variable            | Role                                                  |
| ------------------- | ----------------------------------------------------- |
| `JWT_SECRET`        | Должен совпадать с core-auth и другими сервисами      |
| `CORE_AUTH_URL`     | Проверка сессии для защищённых путей                  |
| `CORE_MESSAGES_URL` | Регистрация вложения после загрузки в S3              |
| `S3_*`              | Endpoint, ключи, bucket, регион — см. `app/config.py` |

---

## Troubleshooting

### 401 / «Session invalid»

Проверьте `Authorization: Bearer`, срок JWT и доступность **core-auth** для проверки сессии.

### 502 «Failed to register attachment with core-messages»

- Доступен ли **core-messages** по `CORE_MESSAGES_URL`
- Существует ли сообщение и участник беседы (см. `core-messages` `/files`)
- Совпадает ли `JWT_SECRET` между сервисами, если цепочка завязана на токен

### Ошибки MinIO / S3

Проверьте `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` и сеть до хранилища.

### JWT validation errors

Убедитесь, что `JWT_SECRET` в `.env` совпадает с **core-auth**:

```env
JWT_SECRET=local-development-secret
```

## See Also

- `README.md` — обзор сервиса и запуск
- `router.yaml` — маршруты и `auth_level`
- `services/core-auth/TESTING.md` — логин и тестовые пользователи
