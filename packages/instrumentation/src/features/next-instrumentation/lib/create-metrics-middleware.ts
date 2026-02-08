import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Span } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api';

type HttpRequest = IncomingMessage | ClientRequest;
type HttpResponse = IncomingMessage | ServerResponse;

/**
 * Создает middleware для записи HTTP метрик с http.route
 * Это обходное решение для проблемы, когда атрибуты из spans не попадают в метрики
 */
export function createHttpMetricsMiddleware(serviceName: string) {
  const meter = metrics.getMeter(serviceName);

  // Создаем histogram для длительности запросов
  const httpDurationHistogram = meter.createHistogram('http.server.duration.custom', {
    description: 'HTTP server request duration with http.route',
    unit: 'ms',
  });

  // Создаем counter для количества запросов
  const httpRequestCounter = meter.createCounter('http.server.requests.custom', {
    description: 'HTTP server request count with http.route',
    unit: '1',
  });

  // Нормализует путь для использования в качестве http.route
  function normalizeRoute(urlPath: string): string {
    const pathWithoutQuery = urlPath.split('?')[0];
    const normalized = pathWithoutQuery === '/' ? '/' : pathWithoutQuery.replace(/\/$/, '');

    if (normalized.startsWith('/_next/')) return '/_next/*';
    if (normalized.startsWith('/__nextjs')) return '/__nextjs/*';

    if (normalized.startsWith('/api/')) {
      const parts = normalized.split('/');
      const routeParts = parts.map((part, index) => {
        if (index < 2) return part;
        if (/^\d+$/.test(part)) return ':id';
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) return ':uuid';
        return part;
      });
      return routeParts.join('/');
    }

    const parts = normalized.split('/');
    const routeParts = parts.map((part, index) => {
      if (index === 0) return part;
      if (/^\d+$/.test(part)) return ':id';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) return ':uuid';
      return part;
    });

    return routeParts.join('/');
  }

  return {
    requestHook: (span: Span, _request: HttpRequest, startTime: number) => {
      // Сохраняем startTime в span для использования в responseHook
      // biome-ignore lint/suspicious/noExplicitAny: debugging
      (span as any)._httpStartTime = startTime;
    },

    responseHook: (span: Span & { attributes: Record<string, unknown> }, response: HttpResponse) => {
      if ('url' in span.attributes && 'statusCode' in response) {
        const urlPath = String(span.attributes['url.path'] || span.attributes['http.target'] || '');
        const route = normalizeRoute(urlPath);
        const method = String(span.attributes['http.method'] || span.attributes['http.request.method'] || 'GET');
        const statusCode = response.statusCode || 0;

        // Вычисляем длительность
        // biome-ignore lint/suspicious/noExplicitAny: debugging
        const startTime = (span as any)._httpStartTime || Date.now();
        const duration = Date.now() - startTime;

        const attributes = {
          'http.method': method,
          'http.status_code': statusCode,
          'http.route': route,
          'http.target': urlPath,
        };

        // Записываем метрики
        httpDurationHistogram.record(duration, attributes);
        httpRequestCounter.add(1, attributes);
      }
    },
  };
}
