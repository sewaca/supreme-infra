'use server';

import { CoreAuth } from '@supreme-int/api-client/src/index';
import { i18n } from '@supreme-int/i18n';
import { coreAuthClient } from '../../src/shared/api/clients';

export const startForgotPasswordChallenge = async (
  email: string,
): Promise<{ success: boolean; challengeId?: string; expiringAt?: string; error?: string }> => {
  try {
    const { data, response } = await CoreAuth.startForgotPasswordAuthForgotPasswordPost({
      client: coreAuthClient,
      body: { email },
    });

    if (!response.ok || !data) {
      return { success: false, error: i18n('Не удалось начать сброс пароля. Попробуйте позже.') };
    }

    return { success: true, challengeId: data.challenge_id, expiringAt: data.expiring_at };
  } catch {
    return { success: false, error: i18n('Не удалось начать сброс пароля. Попробуйте позже.') };
  }
};

export const verifyForgotPasswordChallenge = async (
  challengeId: string,
  code: string,
): Promise<{ success: boolean; error?: string; attemptsLeft?: number }> => {
  try {
    const { data, error, response } = await CoreAuth.verifyForgotPasswordAuthForgotPasswordChallengeIdVerifyPost({
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

    return { success: false, error: i18n('Неверный код') };
  } catch {
    return { success: false, error: i18n('Ошибка проверки кода') };
  }
};

export const resetForgotPassword = async (
  challengeId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> => {
  if (newPassword.length < 6) {
    return { success: false, error: i18n('Пароль должен содержать минимум 6 символов') };
  }

  try {
    const { response } = await CoreAuth.resetForgotPasswordAuthForgotPasswordChallengeIdResetPost({
      client: coreAuthClient,
      path: { challenge_id: challengeId },
      body: { new_password: newPassword },
    });

    if (!response.ok) {
      return { success: false, error: i18n('Не удалось сбросить пароль. Попробуйте позже.') };
    }

    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось сбросить пароль. Попробуйте позже.') };
  }
};
