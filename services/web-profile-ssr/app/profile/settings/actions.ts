'use server';

import { i18n } from '@supreme-int/i18n';

export const changeEmail = async (
  newEmail: string,
  confirmationCode: string,
): Promise<{ success: boolean; error?: string }> => {
  'use server';
  console.log('[debug] changing email to', newEmail, 'with code', confirmationCode);

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate validation
  if (!newEmail.includes('@')) {
    return { success: false, error: i18n('Неверный формат email') };
  }

  if (confirmationCode.length !== 6) {
    return { success: false, error: i18n('Код подтверждения должен содержать 6 цифр') };
  }

  const isError = Math.random() > 0.8;
  if (isError) {
    console.log('[debug] failed to change email');
    return { success: false, error: i18n('Не удалось изменить email. Попробуйте позже.') };
  }

  console.log('[debug] email changed successfully');
  return { success: true };
};

export const sendEmailConfirmationCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  'use server';
  console.log('[debug] sending confirmation code to', email);

  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!email.includes('@')) {
    return { success: false, error: i18n('Неверный формат email') };
  }

  const isError = Math.random() > 0.9;
  if (isError) {
    console.log('[debug] failed to send confirmation code');
    return { success: false, error: i18n('Не удалось отправить код подтверждения') };
  }

  console.log('[debug] confirmation code sent');
  return { success: true };
};

export const changePassword = async (
  _currentPassword: string,
  newPassword: string,
  confirmationCode: string,
): Promise<{ success: boolean; error?: string }> => {
  'use server';
  console.log('[debug] changing password with code', confirmationCode);

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate validation
  if (newPassword.length < 6) {
    return { success: false, error: i18n('Новый пароль должен содержать минимум 6 символов') };
  }

  if (confirmationCode.length !== 6) {
    return { success: false, error: i18n('Код подтверждения должен содержать 6 цифр') };
  }

  const isError = Math.random() > 0.8;
  if (isError) {
    console.log('[debug] failed to change password');
    return { success: false, error: i18n('Не удалось изменить пароль. Попробуйте позже.') };
  }

  console.log('[debug] password changed successfully');
  return { success: true };
};

export const sendPasswordConfirmationCode = async (): Promise<{ success: boolean; error?: string }> => {
  'use server';
  console.log('[debug] sending password confirmation code');

  await new Promise((resolve) => setTimeout(resolve, 300));

  const isError = Math.random() > 0.9;
  if (isError) {
    console.log('[debug] failed to send confirmation code');
    return { success: false, error: i18n('Не удалось отправить код подтверждения') };
  }

  console.log('[debug] confirmation code sent');
  return { success: true };
};
