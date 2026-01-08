import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import type { Logger } from '@opentelemetry/api-logs';
import { type LogRecord, SeverityNumber } from '@opentelemetry/api-logs';

@Injectable()
export class OtelLoggerService extends ConsoleLogger {
  private otelLogger: Logger | null = null;

  setOtelLogger(logger: Logger): void {
    this.otelLogger = logger;
  }

  private getSeverity(level: LogLevel): { number: SeverityNumber; text: string } {
    switch (level) {
      case 'debug':
      case 'verbose':
        return { number: SeverityNumber.DEBUG, text: 'DEBUG' };
      case 'warn':
        return { number: SeverityNumber.WARN, text: 'WARN' };
      case 'error':
      case 'fatal':
        return { number: SeverityNumber.ERROR, text: 'ERROR' };
      default:
        return { number: SeverityNumber.INFO, text: 'INFO' };
    }
  }

  private formatLogMessage(message: unknown, context?: string): string {
    const contextStr = context ? `[${context}] ` : '';
    if (typeof message === 'object') {
      return `${contextStr}${JSON.stringify(message)}`;
    }
    return `${contextStr}${String(message)}`;
  }

  private emitToOtel(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    if (!this.otelLogger) {
      return;
    }

    const severity = this.getSeverity(level);
    const body = this.formatLogMessage(message, context);

    const logRecord: LogRecord = {
      severityNumber: severity.number,
      severityText: severity.text,
      body,
      attributes: { context: context || 'Application', ...(trace && { trace }) },
    };

    this.otelLogger.emit(logRecord);
  }

  override log(message: unknown, context?: string): void {
    super.log(message, context);
    this.emitToOtel('log', message, context);
  }

  override error(message: unknown, trace?: string, context?: string): void {
    super.error(message, trace, context);
    this.emitToOtel('error', message, context, trace);
  }

  override warn(message: unknown, context?: string): void {
    super.warn(message, context);
    this.emitToOtel('warn', message, context);
  }

  override debug(message: unknown, context?: string): void {
    super.debug(message, context);
    this.emitToOtel('debug', message, context);
  }

  override verbose(message: unknown, context?: string): void {
    super.verbose(message, context);
    this.emitToOtel('verbose', message, context);
  }

  override fatal(message: unknown, context?: string): void {
    super.fatal(message, context);
    this.emitToOtel('fatal', message, context);
  }
}
