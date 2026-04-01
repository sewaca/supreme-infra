import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { unauthorized } from 'next/navigation';
import { coreClientInfoClient } from 'services/web-documents-ssr/src/shared/api/clients';
import { getAuthInfo } from 'services/web-documents-ssr/src/shared/api/getUserId';
import { StudentIdBookPage } from 'services/web-documents-ssr/src/views/StudentIdBookPage/StudentIdBookPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId } = await getAuthInfo();

  if (!userId) {
    unauthorized();
  }

  const personalDataRes = await CoreClientInfo.getPersonalDataProfilePersonalDataGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  if (personalDataRes.error) console.error('[student-id] personal data error:', personalDataRes.error);

  return <StudentIdBookPage user={personalDataRes.data?.user ?? null} stats={personalDataRes.data?.stats ?? null} />;
}
