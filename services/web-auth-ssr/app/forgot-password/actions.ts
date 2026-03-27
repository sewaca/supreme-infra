'use server';

import { i18n } from '@supreme-int/i18n';
import { getCoreAuthUrl } from '../../src/shared/lib/auth.server';

export const startForgotPasswordChallenge = async (
  email: string,
): Promise<{ success: boolean; challengeId?: string; expiringAt?: string; error?: string }> => {
  try {
    const res = await fetch(`${getCoreAuthUrl()}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      return { success: false, error: i18n('Не удалось начать сброс пароля. Попробуйте позже.') };
    }

    const data: { challenge_id: string; expiring_at: string } = await res.json();
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
    const res = await fetch(`${getCoreAuthUrl()}/auth/forgot-password/${challengeId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      return { success: true };
    }

    const data: { detail?: string | { code?: string; attempts_left?: number } } = await res.json();

    if (typeof data.detail === 'object' && data.detail?.code === 'invalid_code') {
      return { success: false, error: i18n('Неверный код'), attemptsLeft: data.detail.attempts_left };
    }
    if (data.detail === 'max_attempts_exceeded') {
      return { success: false, error: i18n('Превышено количество попыток. Начните заново.') };
    }
    if (data.detail === 'expired') {
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
    const res = await fetch(`${getCoreAuthUrl()}/auth/forgot-password/${challengeId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!res.ok) {
      return { success: false, error: i18n('Не удалось сбросить пароль. Попробуйте позже.') };
    }

    return { success: true };
  } catch {
    return { success: false, error: i18n('Не удалось сбросить пароль. Попробуйте позже.') };
  }
};
