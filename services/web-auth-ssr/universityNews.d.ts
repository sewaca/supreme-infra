interface NewsItem {
  title: string;
  url: string;
  date: string;
  category: string;
}
type NewsCache = {
  items: NewsItem[];
  fetchedAt: number;
};

declare var fetchingNewsInterval: NodeJS.Timeout | undefined;
declare var newsCache: NewsCache;
