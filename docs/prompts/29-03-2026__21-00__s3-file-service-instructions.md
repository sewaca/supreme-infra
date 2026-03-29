# File Storage Service — Implementation Instructions

## Context

The `core-messages` service needs file attachment support (images, documents, etc.). The original implementation included direct MinIO/S3 upload inside `core-messages`, but this was removed because file storage should live in a **dedicated service** (`core-files` or similar).

The infrastructure for MinIO is already partially in place. This document describes what exists and what needs to be built.

---

## What's already built

### MinIO Helm chart

`infra/helmcharts/minio/` — complete Helm chart for MinIO deployment:

- `Chart.yaml` — name: `minio`, appVersion: latest
- `values.yaml` — ClusterIP service (ports 9000 API, 9001 console), 10Gi PVC, resources limits 500m/512Mi
- `templates/deployment.yaml` — `minio/minio:latest`, args: `server /data --console-address :9001`
- `templates/service.yaml` — ClusterIP, exposes 9000 + 9001
- `templates/pvc.yaml` — persistent volume claim

Secrets required in Kubernetes: `MINIO_SECRET_KEY` (stored in secrets store same as other services).

Internal cluster URL: `http://minio.default.svc.cluster.local:9000`

### docker-compose.dev.yml

MinIO already added to local dev compose:

```yaml
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  volumes:
    - minio_data:/data

volumes:
  minio_data:
```

Console available at `http://localhost:9001` (admin: minioadmin / minioadmin).

### core-messages integration

`core-messages` already has:

- `message_attachment` table in DB (`infra/databases/core-messages-db/init.sql`)
- `MessageAttachment` ORM model (`services/core-messages/app/models/message.py`)
- `POST /core-messages/files` endpoint that accepts JSON with pre-uploaded file metadata and saves to DB

The files endpoint (`services/core-messages/app/routers/files.py`):

```python
class AddAttachmentRequest(BaseModel):
    message_id: uuid.UUID
    file_url: str       # Full URL to the file in storage
    file_name: str
    file_size: int      # bytes
    mime_type: str
    thumbnail_url: str | None = None  # For images

# POST /core-messages/files → 201 AttachmentResponse
```

So the file service uploads to MinIO → gets back a URL → calls `POST /core-messages/files` to register the attachment with a message.

---

## What needs to be built — the file storage service

### Service: `core-files` (or `core-storage`)

Create via `pnpm generate:service` (mandatory — do NOT create manually).

**Recommended stack:** FastAPI (Python), same as other backend services.

**Responsibilities:**

1. Accept multipart file upload from clients
2. Validate file type and size
3. Upload to MinIO using boto3
4. Generate thumbnail for images (Pillow)
5. Return public URL(s) for the uploaded file(s)

### boto3 pattern (S3-compatible)

```python
import boto3
from botocore.client import Config

s3_client = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint,        # http://minio.default.svc.cluster.local:9000
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
    config=Config(signature_version="s3v4"),
    region_name=settings.s3_region,           # "us-east-1"
)

async def upload_file(content: bytes, key: str, mime_type: str, bucket: str) -> str:
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=content,
        ContentType=mime_type,
    )
    return f"{settings.s3_endpoint}/{bucket}/{key}"
```

For async use wrap in `asyncio.to_thread(...)` or use `aioboto3`.

### Thumbnail generation with Pillow

```python
from io import BytesIO
from PIL import Image

def generate_thumbnail(image_bytes: bytes, max_size: tuple = (300, 300)) -> bytes:
    img = Image.open(BytesIO(image_bytes))
    img.thumbnail(max_size, Image.LANCZOS)
    output = BytesIO()
    fmt = img.format or "JPEG"
    img.save(output, format=fmt, quality=85)
    return output.getvalue()
```

### Key naming convention

```python
import uuid

def make_key(conversation_id: uuid.UUID, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    return f"{conversation_id}/{uuid.uuid4()}.{ext}"

def make_thumbnail_key(original_key: str) -> str:
    base, ext = original_key.rsplit(".", 1)
    return f"{base}_thumb.{ext}"
```

### Bucket initialization

On service startup, ensure bucket exists:

```python
try:
    s3_client.head_bucket(Bucket=settings.s3_bucket)
except Exception:
    s3_client.create_bucket(Bucket=settings.s3_bucket)
    # Make bucket public-readable if needed:
    s3_client.put_bucket_policy(Bucket=settings.s3_bucket, Policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Principal": "*", "Action": "s3:GetObject",
                       "Resource": f"arn:aws:s3:::{settings.s3_bucket}/*"}]
    }))
```

### Validation limits

```python
MAX_FILE_SIZE_MB = 10
MAX_IMAGE_SIZE_MB = 5
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
```

### Service config

```python
class Settings(BaseSettings):
    s3_endpoint: str = "http://minio.default.svc.cluster.local:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = ""
    s3_bucket: str = "messages-attachments"
    s3_region: str = "us-east-1"
    max_file_size_mb: int = 10
    max_image_size_mb: int = 5
    core_messages_url: str = "http://core-messages.default.svc.cluster.local/core-messages"
```

### service.yaml secrets

```yaml
secrets:
  S3_ACCESS_KEY: MINIO_ACCESS_KEY
  S3_SECRET_KEY: MINIO_SECRET_KEY
```

### API design

```
POST /core-files/upload
  Content-Type: multipart/form-data
  Body: file (UploadFile), conversation_id (UUID), message_id (UUID)
  Auth: valid JWT
  Response 201:
    {
      "file_url": "http://minio.../messages-attachments/conv-id/uuid.jpg",
      "thumbnail_url": "http://minio.../messages-attachments/conv-id/uuid_thumb.jpg",
      "file_name": "photo.jpg",
      "file_size": 102400,
      "mime_type": "image/jpeg"
    }
```

After upload, the frontend or the file service itself calls `POST /core-messages/files` to register the attachment with the message.

### pyproject.toml dependencies to add

```toml
"boto3>=1.35.0",
"Pillow>=10.0.0",
"python-multipart>=0.0.12",
```

---

## Ingress

Add to `infra/helmcharts/ingress-nginx/values.yaml` under the core-files service block (similar to core-messages).

Set `proxy-body-size` for large uploads:

```yaml
nginx.ingress.kubernetes.io/proxy-body-size: "20m"
```

---

## MinIO deployment

Deploy the Helm chart to Kubernetes:

```bash
helm upgrade --install minio ./infra/helmcharts/minio \
  --namespace default \
  --set secrets.MINIO_ROOT_PASSWORD=<secret>
```

The secret `MINIO_SECRET_KEY` must exist in the cluster secrets (same secrets system used by other services).
