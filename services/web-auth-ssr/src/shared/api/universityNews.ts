import type { NewsItem } from '@supreme-int/api-client/src/core-news';
import { getNews } from '@supreme-int/api-client/src/core-news';
import { getCoreNewsUrl } from '../lib/environment';

export type { NewsItem };

export async function getUniversityNews(): Promise<NewsItem[]> {
  try {
    return await getNews(getCoreNewsUrl(), 6);
  } catch (e) {
    console.error('[news] Failed to fetch news from core-news.', e);
    return [];
  }
}

export function getNewsUrl(item: NewsItem): string {
  return item.url;
}
