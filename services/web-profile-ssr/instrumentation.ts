import type {
  RequestErrorContext,
  RequestInfo,
} from '@supreme-int/instrumentation/src/features/next-request-error/lib/handle-request-error';
import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.nodejs');
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // Импортируем обработчик только когда нужно (lazy import)
  const { requestErrorHandler } = await import('./instrumentation.nodejs');

  // Приводим типы Next.js к нашим типам
  requestErrorHandler(err, request as unknown as RequestInfo, context as unknown as RequestErrorContext);
};
