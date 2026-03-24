'use server';

import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { i18n } from '@supreme-int/i18n';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

export const updateSettings = async (settings: {
  isNewMessageNotificationsEnabled?: boolean;
  isScheduleChangeNotificationsEnabled?: boolean;
}): Promise<{ success: boolean; error?: string }> => {
  'use server';

  const userId = getUserId();
  try {
    await CoreClientInfo.updateSettingsSettingsPut({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: {
        is_new_message_notifications_enabled: settings.isNewMessageNotificationsEnabled,
        is_schedule_change_notifications_enabled: settings.isScheduleChangeNotificationsEnabled,
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось обновить настройки') };
  }
};

export const changeEmail = async (newEmail: string): Promise<{ success: boolean; error?: string }> => {
  'use server';

  if (!newEmail.includes('@')) {
    return { success: false, error: i18n('Неверный формат email') };
  }

  const userId = getUserId();
  try {
    await CoreClientInfo.changeEmailSettingsEmailPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: { new_email: newEmail },
    });
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось изменить email. Попробуйте позже.') };
  }
};

export const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
  'use server';

  if (newPassword.length < 6) {
    return { success: false, error: i18n('Новый пароль должен содержать минимум 6 символов') };
  }

  const userId = getUserId();
  try {
    await CoreClientInfo.changePasswordSettingsPasswordPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: { current_password: '', new_password: newPassword },
    });
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось изменить пароль. Попробуйте позже.') };
  }
};
