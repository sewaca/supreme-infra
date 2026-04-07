import logging
import re

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

BASE_URL = "https://www.sut.ru"

CATEGORY_MAP: dict[str, str] = {
    "industry": "Индустрия",
    "education": "Образование",
    "science": "Наука",
    "international": "Международное",
    "sport": "Спорт",
    "culture": "Культура",
    "university": "Университет",
    "students": "Студентам",
}

# Date prefix pattern: "26 марта 2026 "
DATE_PREFIX_RE = re.compile(
    r"^(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})\s+",
    re.IGNORECASE,
)


def _parse_news_from_html(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict] = []

    links = soup.find_all("a", href=re.compile(r"^/bonchnews/"))

    for link in links:
        if len(items) >= 20:
            break

        href: str = link.get("href", "")
        parts = [p for p in href.split("/") if p]
        if len(parts) != 3:
            continue

        category_slug = parts[1]
        category = CATEGORY_MAP.get(category_slug, category_slug)

        text = link.get_text(separator=" ", strip=True)
        date_match = DATE_PREFIX_RE.match(text)
        if not date_match:
            continue

        date = date_match.group(1)
        title = text[date_match.end() :].strip()

        if len(title) < 6:
            continue

        full_url = f"{BASE_URL}{href}"
        items.append({"title": title, "url": full_url, "date": date, "category": category})

    return items


async def fetch_university_news() -> list[dict]:
    logger.info("Fetching university news from %s/bonchnews", BASE_URL)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{BASE_URL}/bonchnews",
                headers={"User-Agent": "Mozilla/5.0 (compatible; core-news/1.0)"},
                follow_redirects=True,
            )
        response.raise_for_status()
        items = _parse_news_from_html(response.text)
        logger.info("Parsed %d news items", len(items))
        return items
    except Exception:
        logger.exception("Failed to fetch university news")
        return []
