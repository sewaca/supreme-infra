import type { Logger } from '@opentelemetry/api-logs';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { SeverityText } from '../../../entities/otel/model/SeverityText';

/**
 * Настраивает обработчики для необработанных исключений и отклонений промисов
 * @param logger - OpenTelemetry logger для записи ошибок
 */
export function setupErrorHandlers(logger: Logger): void {
  // Перехватываем необработанные исключения
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: SeverityText.ERROR,
      body: `Uncaught Exception: ${error.message}\nStack: ${error.stack}`,
    });
  });

  // Перехватываем необработанные отклонения промисов
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled Rejection:', reason);
    const errorMessage =
      reason instanceof Error
        ? `Unhandled Rejection: ${reason.message}\nStack: ${reason.stack}`
        : `Unhandled Rejection: ${String(reason)}`;
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: SeverityText.ERROR,
      body: errorMessage,
    });
  });
}
