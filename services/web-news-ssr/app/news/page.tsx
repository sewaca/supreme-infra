import { getNewsNewsGet } from '@supreme-int/api-client/src/generated/core-news';
import type { NewsResponse } from '@supreme-int/api-client/src/generated/core-news/types.gen';
import { coreNewsClient } from '../../src/shared/api/clients';
import { NewsPage } from '../../src/views/NewsPage/NewsPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let news: NewsResponse[] = [];
  const res = await getNewsNewsGet({ client: coreNewsClient, query: { limit: 20 } });
  news = res.data ?? [];

  return <NewsPage news={news} />;
}
