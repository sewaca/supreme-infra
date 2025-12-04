import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';

const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

const sdk = new NodeSDK({
  serviceName: 'backend',
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requestHook: (span, request) => {
          const req = request as {
            method?: string;
            routeOptions?: { url?: string };
          };
          if (req.routeOptions?.url) {
            span.updateName(`${req.method} ${req.routeOptions.url}`);
            span.setAttribute('http.route', req.routeOptions.url);
          }
        },
      },
      '@opentelemetry/instrumentation-fastify': {
        enabled: true,
        requestHook: (span, info) => {
          const request = info.request as {
            method?: string;
            routeOptions?: { url?: string };
          };
          if (request.routeOptions?.url) {
            span.updateName(`${request.method} ${request.routeOptions.url}`);
            span.setAttribute('http.route', request.routeOptions.url);
          }
        },
      },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch((error) =>
      console.log('Error shutting down OpenTelemetry SDK', error),
    )
    .finally(() => process.exit(0));
});

export default sdk;
