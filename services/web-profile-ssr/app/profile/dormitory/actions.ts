'use server';

import { CoreApplications } from '@supreme-int/api-client/src/index';
import { i18n } from '@supreme-int/i18n';
import { coreApplicationsClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

export type DormitoryApplicationFormState = { success: boolean; error?: string } | null;

export const submitDormitoryApplication = async (
  _prevState: DormitoryApplicationFormState,
  formData: FormData,
): Promise<DormitoryApplicationFormState> => {
  'use server';

  const userId = getUserId();
  const yearOfStudy = Number(formData.get('yearOfStudy'));
  const reason = String(formData.get('reason') ?? '').trim();

  if (!yearOfStudy || yearOfStudy < 1 || yearOfStudy > 6) {
    return { success: false, error: i18n('Укажите курс обучения от 1 до 6') };
  }
  if (!reason) {
    return { success: false, error: i18n('Укажите причину заселения') };
  }

  try {
    await CoreApplications.submitDormitoryApplicationDormitoryApplicationsPost({
      client: coreApplicationsClient,
      query: { user_id: userId },
      body: { year_of_study: yearOfStudy, reason },
    });
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось подать заявление. Попробуйте позже.') };
  }
};
