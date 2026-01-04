import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
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

    // Создаем HTTP инструментацию с явной конфигурацией
    const httpInstrumentation = new HttpInstrumentation({
      enabled: true,
      ignoreIncomingRequestHook: () => false,
      ignoreOutgoingRequestHook: () => false,
      requestHook: (
        span: {
          updateName: (name: string) => void;
          setAttribute: (key: string, value: string) => void;
        },
        request: { method?: string; url?: string },
      ) => {
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
      },
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: 'frontend',
      }),
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

// export const onRequestError: import('next').Instrumentation.onRequestError =
//   async (error, request, context) => {
//     // Записываем метрику об ошибке
//     const errorName = error instanceof Error ? error.name : 'UnknownError';
//     const errorDigest =
//       typeof error === 'object' && error !== null && 'digest' in error
//         ? String(error.digest)
//         : 'unknown';

//     requestErrorsCounter.add(1, {
//       method: request.method,
//       path: request.path,
//       route_path: context.routePath,
//       route_type: context.routeType,
//       router_kind: context.routerKind,
//       error_name: errorName,
//       error_digest: errorDigest,
//     });
//   };
