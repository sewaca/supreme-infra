import {
  DEFAULT_LOKI_ENDPOINT,
  DEFAULT_PROMETHEUS_ENDPOINT,
  DEFAULT_PROMETHEUS_PORT,
} from '../../../shared/config/constants';
import type { OpenTelemetrySDK } from '../model/types';

/**
 * Запускает OpenTelemetry SDK и настраивает graceful shutdown
 * @param otelSDK - объект с SDK и loggerProvider
 * @param config - конфигурация для вывода информации
 */
export function startOpenTelemetrySDK(
  otelSDK: OpenTelemetrySDK,
  config: { serviceName: string; lokiEndpoint?: string; prometheusPort?: number; prometheusEndpoint?: string },
): void {
  const { sdk, loggerProvider } = otelSDK;
  const {
    serviceName,
    lokiEndpoint = DEFAULT_LOKI_ENDPOINT,
    prometheusPort = DEFAULT_PROMETHEUS_PORT,
    prometheusEndpoint = DEFAULT_PROMETHEUS_ENDPOINT,
  } = config;

  // Запускаем SDK
  sdk.start();

  console.log(`OpenTelemetry SDK started for ${serviceName} service`);
  console.log(`Prometheus metrics endpoint: http://localhost:${prometheusPort}${prometheusEndpoint}`);
  console.log(`Logs exporter endpoint: ${lokiEndpoint}`);

  // Настраиваем graceful shutdown
  process.on('SIGTERM', () => {
    Promise.all([sdk.shutdown(), loggerProvider.shutdown()])
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.log('Error shutting down OpenTelemetry SDK', error))
      .finally(() => process.exit(0));
  });
}
