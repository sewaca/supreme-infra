import { getNewsNewsGet } from '@supreme-int/api-client/src/generated/core-news/sdk.gen';
import type { NewsResponse } from '@supreme-int/api-client/src/generated/core-news/types.gen';
import { coreNewsClient } from './clients';

export type NewsItem = NewsResponse;

export async function getUniversityNews(): Promise<NewsItem[]> {
  try {
    const { data } = await getNewsNewsGet({ client: coreNewsClient, query: { limit: 6 } });
    return data ?? [];
  } catch (e) {
    console.error('[news] Failed to fetch news from core-news.', e);
    return [];
  }
}

export function getNewsUrl(item: NewsItem): string {
  return item.url;
}
