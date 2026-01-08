import {
  createNestInstrumentationConfig,
  createOpenTelemetrySDK,
  patchConsole,
  setupErrorHandlers,
  startOpenTelemetrySDK,
} from '@supreme-int/instrumentation';

// Конфигурация OpenTelemetry
const config = {
  serviceName: 'auth-bff',
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
