import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import {
  HttpInstrumentation,
  type HttpRequestCustomAttributeFunction,
} from '@opentelemetry/instrumentation-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export async function register() {
  try {
    const prometheusExporter = new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    });

    const requestHook: HttpRequestCustomAttributeFunction = (span, request) => {
      const req = request as { method?: string; url?: string };
      if (req.url) {
        try {
          const url = new URL(req.url, 'http://localhost');
          span.updateName(`${req.method} ${url.pathname}`);
          span.setAttribute('http.route', url.pathname);
          span.setAttribute('http.target', url.pathname);
        } catch {
          // Игнорируем ошибки парсинга URL
        }
      }
    };

    // Создаем HTTP инструментацию с явной конфигурацией
    const httpInstrumentation = new HttpInstrumentation({
      enabled: true,
      ignoreIncomingRequestHook: () => false,
      ignoreOutgoingRequestHook: () => false,
      requestHook,
    });

    sdk = new NodeSDK({
      resource: new Resource({ [ATTR_SERVICE_NAME]: 'frontend' }),
      metricReader: prometheusExporter,
      instrumentations: [httpInstrumentation],
    });

    sdk.start();
    console.log('OpenTelemetry SDK started for frontend service');
    console.log('Prometheus metrics endpoint: http://localhost:9464/metrics');
    console.log(
      'HTTP instrumentation enabled for incoming and outgoing requests',
    );

    process.on('SIGTERM', () => {
      if (sdk) {
        sdk
          .shutdown()
          .then(() => console.log('OpenTelemetry SDK shut down successfully'))
          .catch((error) =>
            console.log('Error shutting down OpenTelemetry SDK', error),
          )
          .finally(() => process.exit(0));
      }
    });
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry SDK:', error);
    throw error;
  }
}
