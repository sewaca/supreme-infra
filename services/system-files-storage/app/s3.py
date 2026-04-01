import asyncio
import json
import logging
import uuid
from io import BytesIO

import boto3
from botocore.client import Config
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

s3_client = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
    config=Config(signature_version="s3v4"),
    region_name=settings.s3_region,
)

_bucket_ready = False


def _ensure_bucket() -> None:
    global _bucket_ready
    if _bucket_ready:
        return
    try:
        s3_client.head_bucket(Bucket=settings.s3_bucket)
    except Exception as e:
        from botocore.exceptions import EndpointConnectionError, NoCredentialsError

        if isinstance(e, EndpointConnectionError):
            raise RuntimeError(
                f"Cannot connect to MinIO at {settings.s3_endpoint!r}. "
                f"Check S3_ENDPOINT env var (current: {settings.s3_endpoint!r}). "
                f"In Kubernetes the correct value is: http://minio.default.svc.cluster.local:9000"
            ) from None
        if isinstance(e, NoCredentialsError):
            raise RuntimeError(
                "MinIO credentials not set. "
                "Check S3_ACCESS_KEY and S3_SECRET_KEY env vars."
            ) from None

        # Bucket doesn't exist — create it
        try:
            s3_client.create_bucket(Bucket=settings.s3_bucket)
            s3_client.put_bucket_policy(
                Bucket=settings.s3_bucket,
                Policy=json.dumps(
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": "*",
                                "Action": "s3:GetObject",
                                "Resource": f"arn:aws:s3:::{settings.s3_bucket}/*",
                            }
                        ],
                    }
                ),
            )
        except Exception as create_err:
            raise RuntimeError(
                f"MinIO reachable at {settings.s3_endpoint!r} but failed to create "
                f"bucket {settings.s3_bucket!r}: {create_err}"
            ) from None
    _bucket_ready = True


async def ensure_bucket() -> None:
    await asyncio.to_thread(_ensure_bucket)


def make_key(conversation_id: uuid.UUID, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    return f"{conversation_id}/{uuid.uuid4()}.{ext}"


def make_thumbnail_key(original_key: str) -> str:
    base, ext = original_key.rsplit(".", 1)
    return f"{base}_thumb.{ext}"


def _generate_thumbnail(image_bytes: bytes, max_size: tuple = (300, 300)) -> bytes:
    img = Image.open(BytesIO(image_bytes))
    fmt = img.format or "JPEG"
    img.thumbnail(max_size, Image.LANCZOS)
    output = BytesIO()
    img.save(output, format=fmt, quality=85)
    return output.getvalue()


def _put_object(content: bytes, key: str, mime_type: str) -> str:
    _ensure_bucket()
    s3_client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=content,
        ContentType=mime_type,
    )
    return f"{settings.s3_endpoint}/{settings.s3_bucket}/{key}"


async def upload_file(content: bytes, key: str, mime_type: str) -> str:
    return await asyncio.to_thread(_put_object, content, key, mime_type)


async def upload_thumbnail(image_bytes: bytes, original_key: str, mime_type: str) -> str:
    thumb_bytes = await asyncio.to_thread(_generate_thumbnail, image_bytes)
    thumb_key = make_thumbnail_key(original_key)
    return await upload_file(thumb_bytes, thumb_key, mime_type)
