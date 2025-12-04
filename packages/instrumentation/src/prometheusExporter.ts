import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

export const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});
