import { createOpenTelemetrySDK } from '@supreme-int/instrumentation/src/entities/otel/lib/create-sdk';
import { startOpenTelemetrySDK } from '@supreme-int/instrumentation/src/entities/otel/lib/start-sdk';
import { patchConsole } from '@supreme-int/instrumentation/src/features/console-patching/lib/patch-console';
import { setupErrorHandlers } from '@supreme-int/instrumentation/src/features/error-handling/lib/setup-handlers';
import { createNestInstrumentationConfig } from '@supreme-int/instrumentation/src/features/nest-instrumentation/lib/create-config';

// Конфигурация OpenTelemetry
const config = {
  serviceName: 'core-recipes-bff',
  lokiEndpoint: process.env.LOKI_ENDPOINT || 'http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs',
  prometheusPort: 9464,
  prometheusEndpoint: '/metrics',
};

// Создаем и настраиваем OpenTelemetry SDK
const otelSDK = createOpenTelemetrySDK({
  ...config,
  instrumentationConfig: createNestInstrumentationConfig(),
});

// Экспортируем loggerProvider для использования в приложении
export const { loggerProvider, sdk, prometheusExporter } = otelSDK;

// Запускаем SDK
startOpenTelemetrySDK(otelSDK, config);

// Настраиваем патчинг console
const consoleLogger = loggerProvider.getLogger('console-interceptor');
patchConsole((logRecord) => consoleLogger.emit(logRecord));

// Настраиваем обработчики ошибок
const errorLogger = loggerProvider.getLogger('error-handler');
setupErrorHandlers(errorLogger);

export default sdk;
