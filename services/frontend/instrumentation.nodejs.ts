import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Span } from '@opentelemetry/api';
import {
  getNodeAutoInstrumentations,
  type InstrumentationConfigMap,
} from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';

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
    requestHook: (span: Span, request: IncomingMessage | ClientRequest) => {
      console.log(
        '[debug] inside request hook. url = ',
        // @ts-ignore debug reason
        request?.url ?? 'unknown',
      );
      if ('url' in request && request.url) {
        // Это server request (IncomingMessage)
        const urlPath = request.url.split('?')[0];
        span.setAttribute('http.route', urlPath);
        span.setAttribute('url.path', urlPath);
        span.updateName(`${request.method} ${urlPath}`);
      } else {
        // Это client request (ClientRequest)
        const clientReq = request as ClientRequest & {
          path?: string;
          _headers?: Record<string, string>;
        };

        if (clientReq.path) {
          const urlPath = clientReq.path.split('?')[0];
          span.setAttribute('url.path', urlPath);
        }

        // Также пробуем извлечь из заголовка host
        const host = clientReq.getHeader?.('host') || clientReq._headers?.host;
        if (host && clientReq.path) {
          const protocol = clientReq.protocol || 'http:';
          try {
            const url = new URL(`${protocol}//${host}${clientReq.path}`);
            span.setAttribute('url.path', url.pathname);
          } catch {
            // Игнорируем ошибки
          }
        }
      }
    },
    responseHook: (span: Span, response: IncomingMessage | ServerResponse) => {
      if ('statusCode' in response && response.statusCode) {
        span.setAttribute('http.status_code', response.statusCode);
      }
    },
  },
};

const sdk = new NodeSDK({
  serviceName: 'frontend',
  metricReader: prometheusExporter,
  instrumentations: [getNodeAutoInstrumentations(nextInstrumentationConfig)],
});

sdk.start();

console.log('OpenTelemetry SDK started for frontend service');
console.log('Prometheus metrics endpoint: http://localhost:9464/metrics');

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch((error) =>
      console.log('Error shutting down OpenTelemetry SDK', error),
    )
    .finally(() => process.exit(0));
});
