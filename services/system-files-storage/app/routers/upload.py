import asyncio
import math

from authorization_py.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import settings
from app.rate_limit import check_rate_limit
from app.s3 import make_key, new_folder, upload_file, upload_thumbnail

router = APIRouter(tags=["upload"])

IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_MIME_TYPES = IMAGE_MIME_TYPES | {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}

MAX_FILES = 10


async def _process_file(file: UploadFile, folder) -> dict:
    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {mime_type} ({file.filename})")

    is_image = mime_type in IMAGE_MIME_TYPES
    max_bytes = (settings.max_image_size_mb if is_image else settings.max_file_size_mb) * 1024 * 1024

    content = await file.read()
    if len(content) > max_bytes:
        limit = settings.max_image_size_mb if is_image else settings.max_file_size_mb
        raise HTTPException(status_code=413, detail=f"File too large (max {limit} MB): {file.filename}")

    key = make_key(folder, file.filename or "file")
    await upload_file(content, key, mime_type)

    thumbnail_url: str | None = None
    if is_image:
        thumb_key = await upload_thumbnail(content, key, mime_type)
        thumbnail_url = f"{settings.public_base_url}/storage/s3/{thumb_key}"

    return {
        "file_url": f"{settings.public_base_url}/storage/s3/{key}",
        "thumbnail_url": thumbnail_url,
        "file_name": file.filename or key.split("/")[-1],
        "file_size": len(content),
        "mime_type": mime_type,
    }


@router.post("/upload", status_code=201)
async def upload_attachments(
    files: list[UploadFile],
    current_user: dict = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=422, detail="No files provided")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=422, detail=f"Too many files (max {MAX_FILES})")

    user_id: str = current_user["sub"]
    allowed, retry_after = check_rate_limit(user_id, len(files))
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": f"Too many uploads. Retry after {math.ceil(retry_after)} seconds."},
            headers={"Retry-After": str(math.ceil(retry_after))},
        )

    folder = new_folder()
    results = await asyncio.gather(*[_process_file(f, folder) for f in files])

    return {"folder": str(folder), "files": results}
