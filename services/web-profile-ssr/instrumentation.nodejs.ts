import type { LogRecord } from '@opentelemetry/api-logs';
import { createOpenTelemetrySDK } from '@supreme-int/instrumentation/src/entities/otel/lib/create-sdk';
import { startOpenTelemetrySDK } from '@supreme-int/instrumentation/src/entities/otel/lib/start-sdk';
import { patchConsole } from '@supreme-int/instrumentation/src/features/console-patching/lib/patch-console';
import { setupErrorHandlers } from '@supreme-int/instrumentation/src/features/error-handling/lib/setup-handlers';
import { createNextInstrumentationConfig } from '@supreme-int/instrumentation/src/features/next-instrumentation/lib/create-config';

// Конфигурация OpenTelemetry
const config = {
  serviceName: 'web-profile-ssr',
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
