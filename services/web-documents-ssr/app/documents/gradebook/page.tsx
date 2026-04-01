import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-documents-ssr/src/shared/api/clients';
import { getAuthInfo } from 'services/web-documents-ssr/src/shared/api/getUserId';
import { GradebookPage } from 'services/web-documents-ssr/src/views/GradebookPage/GradebookPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId } = await getAuthInfo();

  const gradesRes = await CoreClientInfo.getGradesRatingGradesGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  if (gradesRes.error) {
    console.error('[gradebook] API error:', gradesRes.error);
  } else {
    console.log('[gradebook] received grades count:', gradesRes.data?.length ?? 0);
  }

  const grades = gradesRes.data ?? [];

  return <GradebookPage grades={grades} />;
}
