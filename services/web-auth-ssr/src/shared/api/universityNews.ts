import { CoreNews } from '@supreme-int/api-client';
import { getCoreNewsUrl } from '../lib/environment';

export type NewsItem = CoreNews.NewsItem;

export async function getUniversityNews(): Promise<NewsItem[]> {
  try {
    return await CoreNews.getNews(getCoreNewsUrl(), 6);
  } catch (e) {
    console.error('[news] Failed to fetch news from core-news.', e);
    return [];
  }
}

export function getNewsUrl(item: NewsItem): string {
  return item.url;
}
