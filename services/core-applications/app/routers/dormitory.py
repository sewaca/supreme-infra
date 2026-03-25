from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.dormitory import DormitoryApplicationRequest, DormitoryApplicationResponse

router = APIRouter(prefix="/dormitory", tags=["dormitory"])


@router.post("/parent-agreement")
async def upload_parent_agreement(
    user_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # TODO: implement — store parent agreement file, return file URL or confirmation
    raise NotImplementedError("upload_parent_agreement not implemented")


@router.post("/applications", response_model=DormitoryApplicationResponse)
async def submit_dormitory_application(
    body: DormitoryApplicationRequest,
    user_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    # TODO: store to DB, generate PDF
    return DormitoryApplicationResponse(status="ok")
