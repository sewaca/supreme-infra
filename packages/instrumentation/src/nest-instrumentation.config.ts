import type { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';

export const nestInstrumentationConfig: InstrumentationConfigMap = {
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
};
