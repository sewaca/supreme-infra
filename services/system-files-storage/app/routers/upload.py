import uuid

import httpx
from fastapi import APIRouter, HTTPException, Request, UploadFile

from app.config import settings
from app.s3 import make_key, upload_file, upload_thumbnail

router = APIRouter(tags=["upload"])

IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_MIME_TYPES = IMAGE_MIME_TYPES | {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.post("/upload", status_code=201)
async def upload_attachment(
    request: Request,
    file: UploadFile,
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
):
    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {mime_type}")

    is_image = mime_type in IMAGE_MIME_TYPES
    max_bytes = (settings.max_image_size_mb if is_image else settings.max_file_size_mb) * 1024 * 1024

    content = await file.read()
    if len(content) > max_bytes:
        limit = settings.max_image_size_mb if is_image else settings.max_file_size_mb
        raise HTTPException(status_code=413, detail=f"File too large (max {limit} MB)")

    key = make_key(conversation_id, file.filename or "file")
    file_url = await upload_file(content, key, mime_type)

    thumbnail_url: str | None = None
    if is_image:
        thumbnail_url = await upload_thumbnail(content, key, mime_type)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.core_messages_url}/files",
            json={
                "message_id": str(message_id),
                "file_url": file_url,
                "file_name": file.filename or key.split("/")[-1],
                "file_size": len(content),
                "mime_type": mime_type,
                "thumbnail_url": thumbnail_url,
            },
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail="Failed to register attachment with core-messages")

    return {
        "file_url": file_url,
        "thumbnail_url": thumbnail_url,
        "file_name": file.filename or key.split("/")[-1],
        "file_size": len(content),
        "mime_type": mime_type,
    }
