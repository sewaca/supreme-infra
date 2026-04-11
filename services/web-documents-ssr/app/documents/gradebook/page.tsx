import { getGradesRatingGradesGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { unauthorized } from 'next/navigation';
import { getAuthInfo } from 'services/web-documents-ssr/src/shared/api/getUserId';
import { GradebookPage } from 'services/web-documents-ssr/src/views/GradebookPage/GradebookPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId } = await getAuthInfo();

  if (!userId) {
    unauthorized();
  }

  const gradesRes = await getGradesRatingGradesGet({
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
