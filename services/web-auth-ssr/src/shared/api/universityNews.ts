export interface NewsItem {
  title: string;
  url: string;
  date: string;
  category: string;
}

const BASE_URL = 'https://www.sut.ru';

// Fallback data used when fetch fails
let FALLBACK_NEWS: NewsItem[] = [
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
];

function parseNewsFromHtml(html: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Match news list items — the site uses <div class="views-row"> blocks
  const rowRegex =
    /<div[^>]*class="[^"]*views-row[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*views-row|<\/div>\s*<\/div>)/g;
  let match = rowRegex.exec(html);

  while (match && items.length < 6) {
    console.log('[test] const block = ', match[1]);
    const block = match[1];

    const titleMatch = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    const dateMatch = /<span[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block);
    const catMatch = /<span[^>]*class="[^"]*category[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block);

    if (titleMatch) {
      const href = titleMatch[1].startsWith('/') ? titleMatch[1] : `/${titleMatch[1]}`;
      const title = titleMatch[2].replace(/<[^>]+>/g, '').trim();
      const date = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      console.log(
        `[test] parsed row: \n    title="${title}"\n    url="${href}"\n    date="${date}"\n    category="${category}"`,
      );

      if (title && title.length > 10) {
        items.push({ title, url: href, date, category });
      }
    }

    match = rowRegex.exec(html);
  }

  return items;
}

export async function fetchUniversityNews(): Promise<NewsItem[]> {
  try {
    console.time('[news] fetch news request');
    const res = await fetch(`${BASE_URL}/bonchnews`, {
      next: { revalidate: 1800 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; web-auth-ssr/1.0)' },
    });
    console.timeEnd('[news] fetch news request');
    console.log(`[news] fetch news ended with "${res.status} ${res.statusText}"`);

    if (!res.ok) {
      return FALLBACK_NEWS;
    }

    const html = await res.text();
    const parsed = parseNewsFromHtml(html);

    if (parsed?.length) {
      FALLBACK_NEWS = [...parsed, ...FALLBACK_NEWS].slice(0, 3);
    }

    return parsed.length >= 3 ? parsed : FALLBACK_NEWS;
  } catch (e) {
    console.error('[news] Failed to fetch news', e);
    return FALLBACK_NEWS;
  }
}

export function getNewsUrl(item: NewsItem): string {
  return `${BASE_URL}${item.url}`;
}
