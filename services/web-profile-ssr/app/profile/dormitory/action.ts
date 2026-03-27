'use server';

import { CoreApplications } from '@supreme-int/api-client/src/index';
import { coreApplicationsClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getMockedUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

export const submitParentAgreement = async ({
  applicationId: _applicationId,
  file,
}: {
  applicationId: string;
  file: File;
}): Promise<{ success: boolean; error?: string }> => {
  'use server';

  const userId = getMockedUserId();
  try {
    await CoreApplications.uploadParentAgreementDormitoryParentAgreementPost({
      client: coreApplicationsClient,
      query: { user_id: userId },
      body: { file },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Не удалось загрузить файл' };
  }
};
