import logging

from sqlalchemy.dialects.postgresql import insert

from app.database import AsyncSessionLocal
from app.models.news import News
from app.services.parser import fetch_university_news

logger = logging.getLogger(__name__)


async def sync_news() -> None:
    logger.info("Starting news sync job")
    items = await fetch_university_news()
    if not items:
        logger.warning("No news items fetched, skipping sync")
        return

    async with AsyncSessionLocal() as session:
        try:
            for item in items:
                stmt = (
                    insert(News)
                    .values(
                        title=item["title"],
                        url=item["url"],
                        date=item["date"],
                        category=item["category"],
                    )
                    .on_conflict_do_nothing(index_elements=["url"])
                )
                await session.execute(stmt)
            await session.commit()
            logger.info("News sync complete, processed %d items", len(items))
        except Exception:
            await session.rollback()
            logger.exception("Failed to sync news to database")
