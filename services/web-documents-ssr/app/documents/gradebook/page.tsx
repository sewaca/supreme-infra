import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-documents-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-documents-ssr/src/shared/api/getUserId';
import { GradebookPage } from 'services/web-documents-ssr/src/views/GradebookPage/GradebookPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const userId = getUserId();

  const gradesRes = await CoreClientInfo.getGradesRatingGradesGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  const grades = gradesRes.data ?? [];

  return <GradebookPage grades={grades} />;
}
