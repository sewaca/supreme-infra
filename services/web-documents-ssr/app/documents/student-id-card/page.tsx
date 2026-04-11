import { getPersonalDataProfilePersonalDataGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { unauthorized } from 'next/navigation';
import { getAuthInfo } from 'services/web-documents-ssr/src/shared/api/getUserId';
import { StudentIdBookPage } from 'services/web-documents-ssr/src/views/StudentIdBookPage/StudentIdBookPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId } = await getAuthInfo();

  if (!userId) {
    unauthorized();
  }

  const personalDataRes = await getPersonalDataProfilePersonalDataGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  if (personalDataRes.error) console.error('[student-id] personal data error:', personalDataRes.error);

  return <StudentIdBookPage user={personalDataRes.data?.user ?? null} stats={personalDataRes.data?.stats ?? null} />;
}
