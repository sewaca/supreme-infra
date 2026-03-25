import type { Instrumentation } from 'next';

/**
 * Обработчик ошибок для Edge Runtime
 * Этот файл НЕ должен импортировать Node.js специфичный код
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // Проверяем runtime
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  // Динамически импортируем Node.js обработчик
  try {
    const { requestErrorHandler } = await import('./instrumentation.nodejs');

    // Вызываем обработчик с приведением типов
    // biome-ignore lint/suspicious/noExplicitAny: debugging
    requestErrorHandler(err, request as any, context as any);
  } catch (error) {
    console.error('[onRequestError] Failed to load handler:', error);
  }
};
