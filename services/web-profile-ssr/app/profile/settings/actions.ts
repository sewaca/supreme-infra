'use server';

import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { i18n } from '@supreme-int/i18n';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

export const changeEmail = async (
  newEmail: string,
  confirmationCode: string,
): Promise<{ success: boolean; error?: string }> => {
  'use server';

  if (!newEmail.includes('@')) {
    return { success: false, error: i18n('Неверный формат email') };
  }

  if (confirmationCode.length !== 6) {
    return { success: false, error: i18n('Код подтверждения должен содержать 6 цифр') };
  }

  const userId = getUserId();
  try {
    const res = await CoreClientInfo.changeEmailSettingsEmailPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: { new_email: newEmail, confirmation_code: confirmationCode },
    });

    const data = res.data;
    if (data && data.status === 'success') {
      return { success: true };
    }
    return { success: false, error: data?.message ?? i18n('Не удалось изменить email. Попробуйте позже.') };
  } catch {
    return { success: false, error: i18n('Не удалось изменить email. Попробуйте позже.') };
  }
};

export const sendEmailConfirmationCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  'use server';

  if (!email.includes('@')) {
    return { success: false, error: i18n('Неверный формат email') };
  }

  const userId = getUserId();
  try {
    const res = await CoreClientInfo.changeEmailSettingsEmailPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: { new_email: email },
    });

    const data = res.data;
    if (data && data.status === '2fa_required') {
      return { success: true };
    }
    return { success: false, error: data?.message ?? i18n('Не удалось отправить код подтверждения') };
  } catch {
    return { success: false, error: i18n('Не удалось отправить код подтверждения') };
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmationCode: string,
): Promise<{ success: boolean; error?: string }> => {
  'use server';

  if (newPassword.length < 6) {
    return { success: false, error: i18n('Новый пароль должен содержать минимум 6 символов') };
  }

  if (confirmationCode.length !== 6) {
    return { success: false, error: i18n('Код подтверждения должен содержать 6 цифр') };
  }

  const userId = getUserId();
  try {
    const res = await CoreClientInfo.changePasswordSettingsPasswordPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        confirmation_code: confirmationCode,
      },
    });

    const data = res.data;
    if (data && data.status === 'success') {
      return { success: true };
    }
    return { success: false, error: data?.message ?? i18n('Не удалось изменить пароль. Попробуйте позже.') };
  } catch {
    return { success: false, error: i18n('Не удалось изменить пароль. Попробуйте позже.') };
  }
};

export const sendPasswordConfirmationCode = async (): Promise<{ success: boolean; error?: string }> => {
  'use server';

  const userId = getUserId();
  try {
    const res = await CoreClientInfo.changePasswordSettingsPasswordPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: { current_password: '', new_password: '' },
    });

    const data = res.data;
    if (data && data.status === '2fa_required') {
      return { success: true };
    }
    return { success: false, error: data?.message ?? i18n('Не удалось отправить код подтверждения') };
  } catch {
    return { success: false, error: i18n('Не удалось отправить код подтверждения') };
  }
};
