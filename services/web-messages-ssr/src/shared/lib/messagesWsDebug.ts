/**
 * Включение: в консоли браузера выполнить
 *   localStorage.setItem('DEBUG_MESSAGES_WS', '1')
 * и обновить страницу. Выключить: removeItem или '0'.
 * Либо NEXT_PUBLIC_DEBUG_MESSAGES_WS=1 при сборке.
 */

export function isMessagesWsDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (process.env.NEXT_PUBLIC_DEBUG_MESSAGES_WS === '1') return true;
    return localStorage.getItem('DEBUG_MESSAGES_WS') === '1';
  } catch {
    return false;
  }
}

export function messagesWsDebug(
  scope: string,
  message: string,
  extra?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!isMessagesWsDebugEnabled()) return;
  const payload: Record<string, unknown> = { t: new Date().toISOString(), scope, message };
  if (extra) Object.assign(payload, extra);
  console.log('[messages-ws-debug]', payload);
}
