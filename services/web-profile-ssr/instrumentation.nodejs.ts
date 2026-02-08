// ВАЖНО: Устанавливаем переменную окружения ДО импортов
// Это заставляет HTTP instrumentation использовать новые семантические конвенции
// которые включают http.route в метрики
process.env.OTEL_SEMCONV_STABILITY_OPT_IN = 'http/dup';

import { metrics } from '@opentelemetry/api';
import type { LogRecord } from '@opentelemetry/api-logs';
import { createMetricViews } from '@supreme-int/instrumentation/src/entities/otel/lib/create-metric-views';
import { createOpenTelemetrySDK } from '@supreme-int/instrumentation/src/entities/otel/lib/create-sdk';
import { startOpenTelemetrySDK } from '@supreme-int/instrumentation/src/entities/otel/lib/start-sdk';
import { patchConsole } from '@supreme-int/instrumentation/src/features/console-patching/lib/patch-console';
import { setupErrorHandlers } from '@supreme-int/instrumentation/src/features/error-handling/lib/setup-handlers';
import { createNextInstrumentationConfig } from '@supreme-int/instrumentation/src/features/next-instrumentation/lib/create-config';
import { createRequestErrorHandler } from '@supreme-int/instrumentation/src/features/next-request-error/lib/create-request-error-handler';

// Конфигурация OpenTelemetry
const config = {
  serviceName: 'web-profile-ssr',
  lokiEndpoint: process.env.LOKI_ENDPOINT || 'http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs',
  prometheusPort: 9464,
  prometheusEndpoint: '/metrics',
};

// Создаем и настраиваем OpenTelemetry SDK с Views для Next.js
const otelSDK = createOpenTelemetrySDK({
  ...config,
  instrumentationConfig: createNextInstrumentationConfig(),
  views: createMetricViews(), // Добавляем Views только для Next.js сервисов
});

// Запускаем SDK
startOpenTelemetrySDK(otelSDK, config);

// Настраиваем патчинг console
const consoleLogger = otelSDK.loggerProvider.getLogger('console-interceptor');
patchConsole((logRecord: LogRecord) => consoleLogger.emit(logRecord));

// Настраиваем обработчики ошибок
const errorLogger = otelSDK.loggerProvider.getLogger('error-handler');
setupErrorHandlers(errorLogger);

// Создаем метрики для отслеживания ошибок запросов
const meter = metrics.getMeter(config.serviceName);
const requestErrorCounter = meter.createCounter('http.server.request.errors', {
  description: 'Total number of HTTP server request errors',
  unit: '1',
});

// Создаем обработчик ошибок запросов
export const requestErrorHandler = createRequestErrorHandler({
  logger: otelSDK.loggerProvider.getLogger('request-error-handler'),
  errorCounter: requestErrorCounter,
  serviceName: config.serviceName,
});
