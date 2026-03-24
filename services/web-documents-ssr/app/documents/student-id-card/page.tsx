import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-documents-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-documents-ssr/src/shared/api/getUserId';
import { StudentIdBookPage } from 'services/web-documents-ssr/src/views/StudentIdBookPage/StudentIdBookPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const userId = getUserId();

  const [personalDataRes, statsRes] = await Promise.all([
    CoreClientInfo.getPersonalDataProfilePersonalDataGet({
      client: coreClientInfoClient,
      query: { user_id: userId },
    }),
    CoreClientInfo.getStatsRatingStatsGet({
      client: coreClientInfoClient,
      query: { user_id: userId },
    }),
  ]);

  if (personalDataRes.error) console.error('[student-id] personal data error:', personalDataRes.error);
  if (statsRes.error) console.error('[student-id] stats error:', statsRes.error);

  return <StudentIdBookPage user={personalDataRes.data?.user ?? null} stats={statsRes.data ?? null} />;
}
