import type { Counter } from '@opentelemetry/api';
import type { Logger } from '@opentelemetry/api-logs';
import type { RequestErrorContext, RequestInfo } from './handle-request-error';
import { handleRequestError } from './handle-request-error';

/**
 * Конфигурация для создания обработчика ошибок запросов
 */
export interface CreateRequestErrorHandlerConfig {
  logger: Logger;
  errorCounter: Counter;
  serviceName: string;
}

/**
 * Создает обработчик ошибок для Next.js onRequestError hook
 *
 * @param config - конфигурация с logger, counter и именем сервиса
 * @returns функция-обработчик для экспорта в instrumentation.ts
 *
 * @example
 * ```typescript
 * // В instrumentation.nodejs.ts
 * export const requestErrorHandler = createRequestErrorHandler({
 *   logger: otelSDK.loggerProvider.getLogger('request-error-handler'),
 *   errorCounter: requestErrorCounter,
 *   serviceName: 'my-service',
 * });
 *
 * // В instrumentation.ts
 * import type { Instrumentation } from 'next';
 *
 * export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
 *   const { requestErrorHandler } = await import('./instrumentation.nodejs');
 *   requestErrorHandler(err, request as any, context as any);
 * };
 * ```
 */
export function createRequestErrorHandler(
  config: CreateRequestErrorHandlerConfig,
): (err: unknown, request: RequestInfo, context: RequestErrorContext) => void {
  return (err: unknown, request: RequestInfo, context: RequestErrorContext) => {
    handleRequestError(config, err, request, context);
  };
}
