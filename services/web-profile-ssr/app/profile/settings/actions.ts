'use server';

import { TOKEN_KEY } from '@supreme-int/api-client/src/core-auth-bff';
import { CoreAuth, CoreClientInfo } from '@supreme-int/api-client/src/index';
import { decodeJwt } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { coreAuthClient, coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getServerAuthToken } from 'services/web-profile-ssr/src/shared/api/getAuthToken';

async function getAuthUserId(): Promise<string> {
  const token = await getServerAuthToken();
  if (!token) throw new Error('No auth token');
  const payload = decodeJwt(token);
  if (!payload?.sub) throw new Error('Invalid token: missing sub');
  return payload.sub;
}

export const updateSettings = async (settings: {
  isNewMessageNotificationsEnabled?: boolean;
  isScheduleChangeNotificationsEnabled?: boolean;
}): Promise<{ success: boolean; error?: string }> => {
  'use server';

  const userId = await getAuthUserId();
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

export const startChallenge = async (): Promise<{
  success: boolean;
  challengeId?: string;
  expiringAt?: string;
  error?: string;
}> => {
  'use server';

  try {
    const { data, response } = await CoreAuth.startChallengeAuthChallengePost({
      client: coreAuthClient,
    });

    if (!response.ok || !data) {
      return { success: false, error: i18n('Не удалось начать проверку. Попробуйте позже.') };
    }

    return { success: true, challengeId: String(data.challenge_id), expiringAt: String(data.expiring_at) };
  } catch {
    return { success: false, error: i18n('Не удалось начать проверку. Попробуйте позже.') };
  }
};

export const verifyChallenge = async (
  challengeId: string,
  code: string,
): Promise<{ success: boolean; error?: string; attemptsLeft?: number }> => {
  'use server';

  try {
    const { data, error, response } = await CoreAuth.verifyChallengeAuthChallengeChallengeIdVerifyPost({
      client: coreAuthClient,
      path: { challenge_id: challengeId },
      body: { code },
    });

    if (response.ok && data) {
      return { success: true };
    }

    const detail = (error as { detail?: string | { code?: string; attempts_left?: number } } | undefined)?.detail;

    if (typeof detail === 'object' && detail?.code === 'invalid_code') {
      return { success: false, error: i18n('Неверный код'), attemptsLeft: detail.attempts_left };
    }
    if (detail === 'max_attempts_exceeded') {
      return { success: false, error: i18n('Превышено количество попыток. Начните заново.') };
    }
    if (detail === 'expired') {
      return { success: false, error: i18n('Код истёк. Начните заново.') };
    }
    if (detail === 'already_resolved') {
      return { success: false, error: i18n('Код уже использован.') };
    }

    return { success: false, error: i18n('Неверный код') };
  } catch {
    return { success: false, error: i18n('Ошибка проверки кода') };
  }
};

export const applyEmailChange = async (
  challengeId: string,
  newEmail: string,
): Promise<{ success: boolean; error?: string }> => {
  'use server';

  if (!newEmail.includes('@')) {
    return { success: false, error: i18n('Неверный формат email') };
  }

  const userId = await getAuthUserId();

  try {
    const { response } = await CoreClientInfo.changeEmailSettingsEmailPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: { new_email: newEmail, challenge_id: challengeId },
    });

    if (response.status === 409) {
      return { success: false, error: i18n('Этот email уже занят') };
    }
    if (!response.ok) {
      return { success: false, error: i18n('Не удалось изменить email. Попробуйте позже.') };
    }

    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось изменить email. Попробуйте позже.') };
  }
};

export const applyPasswordChange = async (
  challengeId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> => {
  'use server';

  if (newPassword.length < 6) {
    return { success: false, error: i18n('Новый пароль должен содержать минимум 6 символов') };
  }

  const userId = await getAuthUserId();

  try {
    const { response } = await CoreClientInfo.changePasswordSettingsPasswordPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: { new_password: newPassword, challenge_id: challengeId },
    });

    if (!response.ok) {
      return { success: false, error: i18n('Не удалось изменить пароль. Попробуйте позже.') };
    }

    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось изменить пароль. Попробуйте позже.') };
  }
};

export const logoutCurrentSession = async (): Promise<void> => {
  'use server';

  try {
    const { data: sessions } = await CoreAuth.getSessionsAuthSessionsGet({ client: coreAuthClient });
    const currentSession = sessions?.find((s) => s.is_current);
    if (currentSession) {
      await CoreAuth.revokeSessionAuthSessionsSessionIdDelete({
        client: coreAuthClient,
        path: { session_id: currentSession.id },
      });
    }
  } catch {
    // Ignore errors — proceed with logout regardless
  }

  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);

  redirect('/');
};

export const revokeSession = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
  'use server';

  try {
    const { response } = await CoreAuth.revokeSessionAuthSessionsSessionIdDelete({
      client: coreAuthClient,
      path: { session_id: sessionId },
    });

    if (!response.ok) {
      return { success: false, error: i18n('Не удалось завершить сессию') };
    }
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось завершить сессию') };
  }
};
