import type { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';
import type { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import type { LoggerProvider } from '@opentelemetry/sdk-logs';
import type { NodeSDK } from '@opentelemetry/sdk-node';

export interface OpenTelemetryConfig {
  serviceName: string;
  lokiEndpoint?: string;
  prometheusPort?: number;
  prometheusEndpoint?: string;
  instrumentationConfig?: InstrumentationConfigMap;
}

export interface OpenTelemetrySDK {
  sdk: NodeSDK;
  loggerProvider: LoggerProvider;
  prometheusExporter: PrometheusExporter;
}
