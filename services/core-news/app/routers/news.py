import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.news import News
from app.schemas.news import NewsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/news", tags=["news"])


@router.get("", response_model=list[NewsResponse])
async def get_news(
    limit: int = Query(default=6, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(News).order_by(News.created_at.desc()).limit(limit))
    return result.scalars().all()
