import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Span } from '@opentelemetry/api';
import {
  getNodeAutoInstrumentations,
  type InstrumentationConfigMap,
} from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | null = null;

export async function register() {
  try {
    const prometheusExporter = new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    });

    const nextInstrumentationConfig: InstrumentationConfigMap = {
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        // Server-side hook для входящих запросов
        requestHook: (span: Span, request: IncomingMessage | ClientRequest) => {
          if ('url' in request && request.url) {
            // Это server request (IncomingMessage)
            const urlPath = request.url.split('?')[0];
            span.setAttribute('http.route', urlPath);
            span.setAttribute('url.path', urlPath);
            span.updateName(`${request.method} ${urlPath}`);
          } else if ('path' in request && request.path) {
            // Это client request (ClientRequest)
            try {
              const urlPath =
                typeof request.path === 'string'
                  ? request.path.split('?')[0]
                  : request.path;
              span.setAttribute('url.path', urlPath);
            } catch {
              // Игнорируем ошибки парсинга
            }
          }
        },
        // Response hook для дополнительной информации
        responseHook: (
          span: Span,
          response: IncomingMessage | ServerResponse,
        ) => {
          if ('statusCode' in response && response.statusCode) {
            span.setAttribute('http.status_code', response.statusCode);
          }
        },
      },
    };

    sdk = new NodeSDK({
      serviceName: 'frontend',
      metricReader: prometheusExporter,
      instrumentations: [
        getNodeAutoInstrumentations(nextInstrumentationConfig),
      ],
    });

    sdk.start();

    console.log('OpenTelemetry SDK started for frontend service');
    console.log('Prometheus metrics endpoint: http://localhost:9464/metrics');

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
