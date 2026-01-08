import type { LogRecord } from '@opentelemetry/api-logs';
import {
  createNextInstrumentationConfig,
  createOpenTelemetrySDK,
  patchConsole,
  setupErrorHandlers,
  startOpenTelemetrySDK,
} from '@supreme-int/instrumentation';

// Конфигурация OpenTelemetry
const config = {
  serviceName: 'frontend',
  lokiEndpoint: process.env.LOKI_ENDPOINT || 'http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs',
  prometheusPort: 9464,
  prometheusEndpoint: '/metrics',
};

// Создаем и настраиваем OpenTelemetry SDK
const otelSDK = createOpenTelemetrySDK({
  ...config,
  instrumentationConfig: createNextInstrumentationConfig(),
});

// Запускаем SDK
startOpenTelemetrySDK(otelSDK, config);

// Настраиваем патчинг console
const consoleLogger = otelSDK.loggerProvider.getLogger('console-interceptor');
patchConsole((logRecord: LogRecord) => consoleLogger.emit(logRecord));

// Настраиваем обработчики ошибок
const errorLogger = otelSDK.loggerProvider.getLogger('error-handler');
setupErrorHandlers(errorLogger);
