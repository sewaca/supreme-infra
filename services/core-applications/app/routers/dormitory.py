from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/dormitory", tags=["dormitory"])


@router.post("/parent-agreement")
async def upload_parent_agreement(
    user_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # TODO: implement — store parent agreement file, return file URL or confirmation
    raise NotImplementedError("upload_parent_agreement not implemented")
