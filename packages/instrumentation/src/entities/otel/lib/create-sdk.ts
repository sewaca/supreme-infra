import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import {
  DEFAULT_LOKI_ENDPOINT,
  DEFAULT_PROMETHEUS_ENDPOINT,
  DEFAULT_PROMETHEUS_PORT,
} from '../../../shared/config/constants';
import type { OpenTelemetryConfig, OpenTelemetrySDK } from '../model/types';

/**
 * Создает и настраивает OpenTelemetry SDK
 * @param config - конфигурация OpenTelemetry
 * @returns объект с SDK, loggerProvider и prometheusExporter
 */
export function createOpenTelemetrySDK(config: OpenTelemetryConfig): OpenTelemetrySDK {
  const {
    serviceName,
    lokiEndpoint = DEFAULT_LOKI_ENDPOINT,
    prometheusPort = DEFAULT_PROMETHEUS_PORT,
    prometheusEndpoint = DEFAULT_PROMETHEUS_ENDPOINT,
    instrumentationConfig = {},
  } = config;

  // Создаем ресурс с именем сервиса
  const resource = new Resource({ [ATTR_SERVICE_NAME]: serviceName });

  // Настраиваем Prometheus exporter для метрик
  const prometheusExporter = new PrometheusExporter({
    port: prometheusPort,
    endpoint: prometheusEndpoint,
  });

  // Настраиваем OTLP exporter для логов (Loki)
  const logExporter = new OTLPLogExporter({
    url: lokiEndpoint,
    headers: {},
  });

  // Создаем LoggerProvider
  const loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

  // Создаем NodeSDK
  const sdk = new NodeSDK({
    serviceName,
    resource,
    metricReader: prometheusExporter,
    logRecordProcessor: new BatchLogRecordProcessor(logExporter),
    instrumentations: [getNodeAutoInstrumentations(instrumentationConfig)],
  });

  return {
    sdk,
    loggerProvider,
    prometheusExporter,
  };
}
