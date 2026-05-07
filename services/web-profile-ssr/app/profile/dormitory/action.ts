'use server';

import { uploadParentAgreementDormitoryParentAgreementPost } from '@supreme-int/api-client/src/generated/core-applications';
import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import { getAuthInfoOrUnauthorized as getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfoOrUnauthorized';

export const submitParentAgreement = async ({
  applicationId: _applicationId,
  file,
}: {
  applicationId: string;
  file: File;
}): Promise<{ success: boolean; error?: string }> => {
  'use server';

  const { userId } = await getAuthInfo();
  try {
    await uploadParentAgreementDormitoryParentAgreementPost({
      client: coreApplicationsClient,
      query: { user_id: userId },
      body: { file },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Не удалось загрузить файл' };
  }
};
