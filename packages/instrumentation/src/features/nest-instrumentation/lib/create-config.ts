import type { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';

type Request = { method?: string; routeOptions?: { url?: string } };

/**
 * Создает конфигурацию инструментации для NestJS приложений
 * Настраивает трейсинг для HTTP и Fastify
 */
export function createNestInstrumentationConfig(): InstrumentationConfigMap {
  return {
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
        const request = info.request as Request;
        if (request.routeOptions?.url) {
          span.updateName(`${request.method} ${request.routeOptions.url}`);
          span.setAttribute('http.route', request.routeOptions.url);
        }
      },
    },
  };
}
