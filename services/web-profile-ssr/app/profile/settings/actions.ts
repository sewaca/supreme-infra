'use server';

import { TOKEN_KEY } from '@supreme-int/api-client/src/core-auth-bff';
import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { decodeJwt } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { i18n } from '@supreme-int/i18n';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { loggingFetch } from 'services/web-profile-ssr/src/shared/api/fetchWithLog';
import { getServerAuthToken } from 'services/web-profile-ssr/src/shared/api/getAuthToken';
import { getMockedUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { environment } from 'services/web-profile-ssr/src/shared/lib/environment';

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

  const userId = getMockedUserId();
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

  const token = await getServerAuthToken();
  if (!token) {
    return { success: false, error: i18n('Не авторизован') };
  }

  try {
    const res = await loggingFetch(`${environment.coreAuthUrl}/auth/challenge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      return { success: false, error: i18n('Не удалось начать проверку. Попробуйте позже.') };
    }

    const data: { challenge_id: string; expiring_at: string } = await res.json();
    return { success: true, challengeId: data.challenge_id, expiringAt: data.expiring_at };
  } catch {
    return { success: false, error: i18n('Не удалось начать проверку. Попробуйте позже.') };
  }
};

export const verifyChallenge = async (
  challengeId: string,
  code: string,
): Promise<{ success: boolean; error?: string; attemptsLeft?: number }> => {
  'use server';

  const token = await getServerAuthToken();
  if (!token) {
    return { success: false, error: i18n('Не авторизован') };
  }

  try {
    const res = await loggingFetch(`${environment.coreAuthUrl}/auth/challenge/${challengeId}/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      return { success: true };
    }

    const data: { detail?: string | { code?: string; attempts_left?: number } } = await res.json();

    if (typeof data.detail === 'object' && data.detail?.code === 'invalid_code') {
      return {
        success: false,
        error: i18n('Неверный код'),
        attemptsLeft: data.detail.attempts_left,
      };
    }
    if (data.detail === 'max_attempts_exceeded') {
      return { success: false, error: i18n('Превышено количество попыток. Начните заново.') };
    }
    if (data.detail === 'expired') {
      return { success: false, error: i18n('Код истёк. Начните заново.') };
    }
    if (data.detail === 'already_resolved') {
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
  const token = await getServerAuthToken();
  if (!token) {
    return { success: false, error: i18n('Не авторизован') };
  }

  try {
    const res = await loggingFetch(`${environment.coreClientInfoUrl}/settings/email?user_id=${userId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ new_email: newEmail, challenge_id: challengeId }),
    });

    if (res.status === 409) {
      return { success: false, error: i18n('Этот email уже занят') };
    }
    if (!res.ok) {
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
  const token = await getServerAuthToken();
  if (!token) {
    return { success: false, error: i18n('Не авторизован') };
  }

  try {
    const res = await loggingFetch(`${environment.coreClientInfoUrl}/settings/password?user_id=${userId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ new_password: newPassword, challenge_id: challengeId }),
    });

    if (!res.ok) {
      return { success: false, error: i18n('Не удалось изменить пароль. Попробуйте позже.') };
    }

    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось изменить пароль. Попробуйте позже.') };
  }
};

export const logoutCurrentSession = async (): Promise<void> => {
  'use server';

  const token = await getServerAuthToken();

  if (token) {
    try {
      const sessionsRes = await loggingFetch(`${environment.coreAuthUrl}/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (sessionsRes.ok) {
        const sessions: Array<{ id: string; is_current: boolean }> = await sessionsRes.json();
        const currentSession = sessions.find((s) => s.is_current);
        if (currentSession) {
          await loggingFetch(`${environment.coreAuthUrl}/auth/sessions/${currentSession.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    } catch {
      // Ignore errors — proceed with logout regardless
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_KEY);

  redirect('/');
};

export const revokeSession = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
  'use server';

  const token = await getServerAuthToken();
  if (!token) {
    return { success: false, error: i18n('Не авторизован') };
  }

  try {
    const res = await loggingFetch(`${environment.coreAuthUrl}/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return { success: false, error: i18n('Не удалось завершить сессию') };
    }
    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось завершить сессию') };
  }
};
