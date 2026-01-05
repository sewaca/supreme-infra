import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Span } from '@opentelemetry/api';
import { type LogRecord, SeverityNumber } from '@opentelemetry/api-logs';
import { getNodeAutoInstrumentations, type InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const resource = new Resource({ [ATTR_SERVICE_NAME]: 'frontend' });
const lokiEndpoint = process.env.LOKI_ENDPOINT || 'http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs';

const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});
const logExporter = new OTLPLogExporter({ url: lokiEndpoint, headers: {} });

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

export enum SeverityText {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export const patchConsle = (customLoggerEmit: (logRecord: LogRecord) => void) => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;

  const getBody = (...args: unknown[]) =>
    args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');

  console.log = (...args: unknown[]) => {
    originalConsoleLog(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.INFO,
      severityText: SeverityText.INFO,
      body: getBody(...args),
    });
  };

  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.ERROR,
      severityText: SeverityText.ERROR,
      body: getBody(...args),
    });
  };

  console.warn = (...args: unknown[]) => {
    originalConsoleWarn(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.WARN,
      severityText: SeverityText.WARN,
      body: getBody(...args),
    });
  };

  console.info = (...args: unknown[]) => {
    originalConsoleInfo(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.INFO,
      severityText: SeverityText.INFO,
      body: getBody(...args),
    });
  };

  console.debug = (...args: unknown[]) => {
    originalConsoleDebug(...args);
    customLoggerEmit({
      severityNumber: SeverityNumber.DEBUG,
      severityText: SeverityText.DEBUG,
      body: getBody(...args),
    });
  };
};

const logger = loggerProvider.getLogger('console-interceptor');
patchConsle((logRecord: LogRecord) => logger.emit(logRecord));

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

const nextInstrumentationConfig: InstrumentationConfigMap = {
  '@opentelemetry/instrumentation-fs': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    requestHook: (span: Span, request: IncomingMessage | ClientRequest) => {
      console.log(
        '[debug] inside request hook. url = ',
        // @ts-expect-error debug reason
        request?.url ?? 'unknown',
      );

      if ('url' in request && request.url) {
        // Это server request (IncomingMessage)
        const urlPath = request.url.split('?')[0];
        span.setAttribute('http.route', urlPath);
        span.setAttribute('url.path', urlPath);
        span.updateName(`${request.method} ${urlPath}`);
      } else {
        // Это client request (ClientRequest)
        const clientReq = request as ClientRequest & {
          path?: string;
          _headers?: Record<string, string>;
        };

        if (clientReq.path) {
          const urlPath = clientReq.path.split('?')[0];
          span.setAttribute('url.path', urlPath);
        }

        // Также пробуем извлечь из заголовка host
        const host = clientReq.getHeader?.('host') || clientReq._headers?.host;
        if (host && clientReq.path) {
          const protocol = clientReq.protocol || 'http:';
          try {
            const url = new URL(`${protocol}//${host}${clientReq.path}`);
            span.setAttribute('url.path', url.pathname);
          } catch {
            // Игнорируем ошибки
          }
        }

        span.updateName(`${clientReq.method} ${clientReq.path}`);
      }
    },
    responseHook: (span: Span, response: IncomingMessage | ServerResponse) => {
      if ('statusCode' in response && response.statusCode) {
        span.setAttribute('http.status_code', response.statusCode);
      }
    },
  },
};

const sdk = new NodeSDK({
  serviceName: 'frontend',
  metricReader: prometheusExporter,
  logRecordProcessor: new BatchLogRecordProcessor(logExporter),
  instrumentations: [getNodeAutoInstrumentations(nextInstrumentationConfig)],
});

sdk.start();

process.on('SIGTERM', () => {
  Promise.allSettled([
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.log('Error shutting down OpenTelemetry SDK', error)),
    loggerProvider
      ?.shutdown()
      .then(() => console.log('Logger provider shut down successfully'))
      .catch((e) => console.log('Error shutting down logger provider', e)),
  ]).then(() => process.exit(0));
});

console.log('OpenTelemetry SDK started for frontend service');
console.log('Prometheus metrics endpoint: http://localhost:9464/metrics');
console.log(`Logs exporter endpoint: ${lokiEndpoint}`);
