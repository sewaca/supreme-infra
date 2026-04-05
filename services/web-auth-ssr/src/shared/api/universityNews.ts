import { parse } from 'node-html-parser';

export interface NewsItem {
  title: string;
  url: string;
  date: string;
  category: string;
}

const BASE_URL = 'https://www.sut.ru';

const CATEGORY_MAP: Record<string, string> = {
  industry: 'Индустрия',
  education: 'Образование',
  science: 'Наука',
  international: 'Международное',
  sport: 'Спорт',
  culture: 'Культура',
  university: 'Университет',
  students: 'Студентам',
};

// Date prefix pattern: "26 марта 2026 "
const DATE_PREFIX_RE =
  /^(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})\s+/i;

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 3 hours

interface NewsCache {
  items: NewsItem[];
  fetchedAt: number;
}

let cache: NewsCache = {
  fetchedAt: 0, // fetchedAt: 0 — stale immediately, will be refreshed on first request
  items: [
    {
      title: 'СПбГУТ и ассоциация «Дрон-Безопасность» стали стратегическими партнерами',
      url: '/bonchnews/industry/25-03-2026-spbgut-i-associaciya-dron-bezopasnost-stali-strategicheskimi-partnerami',
      date: '25 марта 2026',
      category: 'Индустрия',
    },
    {
      title: 'Стань лидером: курс мини-лекций для студентов стартует 26 марта',
      url: '/bonchnews/education/25-03-2026-stan-liderom:-kurs-mini-lekciy-dlya-studentov-startuet-26-marta',
      date: '25 марта 2026',
      category: 'Образование',
    },
    {
      title: 'Преподаватели СПбГУТ стали победителями грантового конкурса Фонда Владимира Потанина',
      url: '/bonchnews/science/25-03-2026-prepodavateli-spbgut-stali-pobeditelyami-grantovogo-konkursa-blagotvoritelnogo-fonda-vladimira-potanina',
      date: '25 марта 2026',
      category: 'Наука',
    },
    {
      title: 'СПбГУТ представил потенциал на Российско-Китайском деловом форуме',
      url: '/bonchnews/international/25-03-2026-spbgut-predstavil-obrazovatelniy-i-nauchniy-potencial-na-rossiysko-kitayskom-delovom-forume',
      date: '25 марта 2026',
      category: 'Международное',
    },
    {
      title: 'В СПбГУТ завершился первый день III Слёта разработчиков беспилотных систем',
      url: '/bonchnews/industry/25-03-2026-v-spbgut-zavershilsya-perviy-den-III-obscherossiyskogo-sleta-razrabotchikov-bespilotnih-sistem',
      date: '25 марта 2026',
      category: 'Индустрия',
    },
    {
      title: 'Студенты СПбГУТ стали призёрами Всероссийского форума «Неделя инноватики ЛЭТИ»',
      url: '/bonchnews/education/25-03-2026-studenti-spbgut-stali-prizerami-I-vserossiyskogo-nauchno-obrazovatelnogo-foruma-nedelya-innovatiki-leti',
      date: '25 марта 2026',
      category: 'Образование',
    },
  ],
};

function parseNewsFromHtml(html: string): NewsItem[] {
  const root = parse(html);
  const items: NewsItem[] = [];

  // All links that point to individual news articles: /bonchnews/{category}/{slug}
  const links = root.querySelectorAll('a[href^="/bonchnews/"]');

  for (const link of links) {
    if (items.length >= 6) break;

    const href = link.getAttribute('href') ?? '';

    // Only article links have 3 path segments: /bonchnews/{category}/{slug}
    const parts = href.split('/').filter(Boolean);
    if (parts.length !== 3) continue;

    const categorySlug = parts[1];
    const category = CATEGORY_MAP[categorySlug] ?? categorySlug;

    // Text content after stripping nested tags (images etc.)
    const text = link.text.trim();
    const dateMatch = DATE_PREFIX_RE.exec(text);
    if (!dateMatch) continue;

    const date = dateMatch[1];
    const title = text.slice(dateMatch[0].length).trim();

    if (title.length < 10) continue;

    items.push({ title, url: href, date, category });
  }

  return items;
}

async function fetchUniversityNews(): Promise<void> {
  try {
    console.debug(`[news] fetching news from server. date=${new Date().toISOString()}`);

    console.time('[news] fetch news request');
    const res = await fetch(`${BASE_URL}/bonchnews`, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; web-auth-ssr/1.0)' },
    });
    console.timeEnd('[news] fetch news request');

    console.debug(`[news] fetch ended with "${res.status} ${res.statusText}"`);

    if (!res.ok) {
      return;
    }

    const html = await res.text();

    console.time('[news] parsing news from html');
    const parsed = parseNewsFromHtml(html);
    console.timeEnd('[news] parsing news from html');

    console.debug(`[news] parsed ${parsed.length} items`);

    cache = { items: [...parsed, ...cache.items].slice(0, 10), fetchedAt: Date.now() };
  } catch (e) {
    console.error('[news] Failed to fetch news.', e);
  }
}

// setting interval to fetch news every hour just to update cache
if (!global.fetchingNewsInterval) {
  fetchUniversityNews();
  setInterval(fetchUniversityNews, CACHE_TTL_MS / 2);
}

export async function getUniversityNews(): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    console.warn('[news] Cache is stale. News was not refetched correctly.');
  } else {
    console.debug('[news] returning cached news');
  }

  return cache.items;
}

export function getNewsUrl(item: NewsItem): string {
  return `${BASE_URL}${item.url}`;
}
