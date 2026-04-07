export interface NewsItem {
  id: string;
  title: string;
  url: string;
  date: string;
  category: string;
  created_at: string;
}

export async function getNews(baseUrl: string, limit = 6): Promise<NewsItem[]> {
  const res = await fetch(`${baseUrl}/api/news?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`core-news GET /api/news failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<NewsItem[]>;
}
