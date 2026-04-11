import { getNewsNewsGet } from '@supreme-int/api-client/src/generated/core-news';
import { client as coreNewsClient } from '@supreme-int/api-client/src/generated/core-news/client.gen';
import type { NewsResponse } from '@supreme-int/api-client/src/generated/core-news/types.gen';
import { NewsPage } from '../../src/views/NewsPage/NewsPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let news: NewsResponse[] = [];
  const res = await getNewsNewsGet({ client: coreNewsClient, query: { limit: 20 } });
  news = res.data ?? [];

  return <NewsPage news={news} />;
}
