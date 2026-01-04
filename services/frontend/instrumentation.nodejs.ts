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

type Request = { method?: string; url?: string };

const nextInstrumentationConfig: InstrumentationConfigMap = {
  '@opentelemetry/instrumentation-fs': { enabled: false },
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    // Включаем экспорт метрик для HTTP запросов
    ignoreIncomingRequestHook: () => false,
    requestHook: (span, request) => {
      const req = request as Request;
      if (req.url) {
        const url = new URL(req.url, 'http://localhost');
        span.updateName(`${req.method} ${url.pathname}`);
        span.setAttribute('http.route', url.pathname);
        span.setAttribute('http.target', url.pathname);
      }
    },
  },
};

const sdk = new NodeSDK({
  serviceName: 'frontend',
  metricReader: prometheusExporter,
  instrumentations: [getNodeAutoInstrumentations(nextInstrumentationConfig)],
});

// Создаем счетчик для ошибок запросов
// const meter = metrics.getMeter('frontend', '1.0.0');
// const requestErrorsCounter = meter.createCounter('http_request_errors_total', {
//   description: 'Total number of HTTP request errors',
// });

export async function register() {
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
