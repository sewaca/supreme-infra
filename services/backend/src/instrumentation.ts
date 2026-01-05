import {
  getNodeAutoInstrumentations,
  type InstrumentationConfigMap,
} from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const resource = new Resource({ [ATTR_SERVICE_NAME]: 'backend' });
// Configure logs export to Loki via OTLP
const lokiEndpoint =
  process.env.LOKI_ENDPOINT ||
  'http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs';

const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

const logExporter = new OTLPLogExporter({ url: lokiEndpoint, headers: {} });
export const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

type Request = { method?: string; routeOptions?: { url?: string } };

const nestInstrumentationConfig: InstrumentationConfigMap = {
  '@opentelemetry/instrumentation-fs': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    requestHook: (span, request) => {
      const req = request as Request;
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
};

const sdk = new NodeSDK({
  serviceName: 'backend',
  metricReader: prometheusExporter,
  logRecordProcessor: new BatchLogRecordProcessor(logExporter),
  instrumentations: [getNodeAutoInstrumentations(nestInstrumentationConfig)],
});

sdk.start();

console.log('OpenTelemetry SDK started for backend service');
console.log('Prometheus metrics endpoint: http://localhost:9464/metrics');
console.log(`Logs exporter endpoint: ${lokiEndpoint}`);

process.on('SIGTERM', () => {
  Promise.all([sdk.shutdown(), loggerProvider.shutdown()])
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch((error) =>
      console.log('Error shutting down OpenTelemetry SDK', error),
    )
    .finally(() => process.exit(0));
});

export default sdk;
