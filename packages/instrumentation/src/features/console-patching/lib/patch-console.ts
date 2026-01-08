import { type LogRecord, SeverityNumber } from '@opentelemetry/api-logs';
import { SeverityText } from '../../../entities/otel/model/SeverityText';

/**
 * Патчит глобальные методы console для перехвата логов
 * @param customLoggerEmit - функция для обработки перехваченных логов
 */
export function patchConsole(customLoggerEmit: (logRecord: LogRecord) => void): void {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;

  const getBody = (...args: unknown[]): string =>
    args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');

  console.log = (...args: unknown[]): void => {
    originalConsoleLog(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.INFO,
      severityText: SeverityText.INFO,
      body: getBody(...args),
    });
  };

  console.error = (...args: unknown[]): void => {
    originalConsoleError(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.ERROR,
      severityText: SeverityText.ERROR,
      body: getBody(...args),
    });
  };

  console.warn = (...args: unknown[]): void => {
    originalConsoleWarn(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.WARN,
      severityText: SeverityText.WARN,
      body: getBody(...args),
    });
  };

  console.info = (...args: unknown[]): void => {
    originalConsoleInfo(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.INFO,
      severityText: SeverityText.INFO,
      body: getBody(...args),
    });
  };

  console.debug = (...args: unknown[]): void => {
    originalConsoleDebug(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.DEBUG,
      severityText: SeverityText.DEBUG,
      body: getBody(...args),
    });
  };
}
