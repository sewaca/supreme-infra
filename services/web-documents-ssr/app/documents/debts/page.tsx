import { getDebtsDebtsGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
import { unauthorized } from 'next/navigation';
import { DebtsPage } from 'services/web-documents-ssr/src/views/DebtsPage/DebtsPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId, name } = await getAuthInfo();

  if (!userId) {
    unauthorized();
  }

  const res = await getDebtsDebtsGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  if (res.error) {
    console.error('[debts] API error:', res.error);
  }

  return <DebtsPage debts={res.data ?? []} senderName={name ?? ''} />;
}
