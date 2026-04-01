# system-files-storage — Testing

## Prerequisites

- **MinIO** — bucket создаётся автоматически при старте (`ensure_bucket()`)
- **core-auth** — JWT-валидация для `POST /system-files-storage/upload`

БД у сервиса нет.

## Local setup

```bash
cd services/system-files-storage
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8007
```

Локально auth-middleware не требует Bearer на `/upload` (путь матчится как `/system-files-storage/upload`, а локальный — `/upload`).

---

## Get JWT

```bash
export JWT_TOKEN=$(curl -s -X POST "https://diploma.sewaca.ru/core-auth/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "user@example.com"}' | jq -r '.access_token')
```

---

## Status

```bash
curl -s https://diploma.sewaca.ru/system-files-storage/api/status | jq .
```

```json
{ "status": "ok", "service": "system-files-storage" }
```

---

## Upload (batch)

Один запрос — одна папка `{uuidv7}`, все файлы в ней. Максимум 10 файлов.

```bash
curl -s -X POST "https://diploma.sewaca.ru/system-files-storage/upload" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "files=@./image.png;type=image/png" \
  -F "files=@./image3.png;type=image/png" | jq .
```

Ответ:

```json
{
  "folder": "019600a1-e3b1-7c2d-a4f5-000000000000",
  "files": [
    {
      "file_url": "https://diploma.sewaca.ru/storage/s3/019600a1-e3b1-7c2d-a4f5-000000000000/2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824.png",
      "thumbnail_url": "https://diploma.sewaca.ru/storage/s3/019600a1-e3b1-7c2d-a4f5-000000000000/2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824_thumb.png",
      "file_name": "photo.png",
      "file_size": 165113,
      "mime_type": "image/png"
    },
    {
      "file_url": "https://diploma.sewaca.ru/storage/s3/019600a1-e3b1-7c2d-a4f5-000000000000/486ea46224d1bb4fb680f34f7c9ad96a8f24ec88be73ea8e5a6c65260e9cb8a7.pdf",
      "thumbnail_url": null,
      "file_name": "document.pdf",
      "file_size": 42300,
      "mime_type": "application/pdf"
    }
  ]
}
```

Один файл:

```bash
curl -s -X POST "https://diploma.sewaca.ru/system-files-storage/upload" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "files=@./photo.jpg;type=image/jpeg" | jq .
```

---

## Access uploaded file

Файлы публично доступны через возвращённый `file_url`:

```bash
curl -O "https://diploma.sewaca.ru/storage/s3/<folder>/<sha256>.<ext>"
```

---

## Error cases

**401 — нет токена:**

```bash
curl -s -X POST "https://diploma.sewaca.ru/system-files-storage/upload" \
  -F "files=@./photo.png;type=image/png" | jq .
# { "detail": "Authentication required" }
```

**415 — неподдерживаемый тип:**

```bash
curl -s -X POST "https://diploma.sewaca.ru/system-files-storage/upload" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "files=@./archive.zip;type=application/zip" | jq .
# { "detail": "Unsupported file type: application/zip (archive.zip)" }
```

**413 — файл слишком большой:**

```bash
# Изображения: макс 5 MB, остальное: макс 10 MB
# { "detail": "File too large (max 5 MB): bigphoto.png" }
```

---

## Allowed file types

| MIME type                                    | Max size |
| -------------------------------------------- | -------- |
| image/jpeg, image/png, image/gif, image/webp | 5 MB     |
| application/pdf                              | 10 MB    |
| application/msword, .docx                    | 10 MB    |
| text/plain                                   | 10 MB    |

Изображения автоматически получают thumbnail 300×300 (`thumbnail_url`).

---

## Environment reference

| Variable                          | Role                                                               |
| --------------------------------- | ------------------------------------------------------------------ |
| `JWT_SECRET`                      | Должен совпадать с core-auth                                       |
| `CORE_AUTH_URL`                   | Проверка сессии                                                    |
| `S3_ENDPOINT`                     | Адрес MinIO (в K8s: `http://minio.default.svc.cluster.local:9000`) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Credentials MinIO                                                  |
| `S3_BUCKET`                       | Имя bucket (`messages-attachments`)                                |
| `PUBLIC_BASE_URL`                 | Публичный домен для генерации URL (`https://diploma.sewaca.ru`)    |
