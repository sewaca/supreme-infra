export const nestInstrumentationConfig = {
  '@opentelemetry/instrumentation-fs': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    requestHook: (span, request) => {
      const req = request;
      if (req.routeOptions?.url) {
        span.updateName(`${req.method} ${req.routeOptions.url}`);
        span.setAttribute('http.route', req.routeOptions.url);
      }
    },
  },
  '@opentelemetry/instrumentation-fastify': {
    enabled: true,
    requestHook: (span, info) => {
      const request = info.request;
      if (request.routeOptions?.url) {
        span.updateName(`${request.method} ${request.routeOptions.url}`);
        span.setAttribute('http.route', request.routeOptions.url);
      }
    },
  },
};
