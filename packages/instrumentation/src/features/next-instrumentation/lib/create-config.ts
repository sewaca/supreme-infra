import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Attributes, Span } from '@opentelemetry/api';
import type { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';

type HttpRequest = IncomingMessage | ClientRequest;
type HttpResponse = IncomingMessage | ServerResponse;

/**
 * Создает конфигурацию инструментации для Next.js приложений
 * Настраивает трейсинг для HTTP запросов с правильной обработкой URL
 */
export function createNextInstrumentationConfig(): InstrumentationConfigMap {
  return {
    '@opentelemetry/instrumentation-fs': {
      enabled: false,
    },
    '@opentelemetry/instrumentation-http': {
      enabled: true,
      // Добавляем атрибуты ДО создания span - они попадут и в метрики
      startIncomingSpanHook: (request: IncomingMessage): Attributes => {
        const attributes: Attributes = {};
        if (request.url) {
          const urlPath = request.url.split('?')[0];
          // http.route используется для группировки метрик по маршрутам
          attributes['http.route'] = urlPath;
          attributes['url.path'] = urlPath;
        }
        return attributes;
      },
      requestHook: (span: Span, request: HttpRequest) => {
        if ('url' in request && request.url) {
          const urlPath = request.url.split('?')[0];
          // Обновляем имя span для лучшей читаемости в трейсах
          span.updateName(`${request.method} ${urlPath}`);
          span.setAttribute('http.target', request.url);
        } else {
          // Это client request (ClientRequest)
          const clientReq = request as ClientRequest & {
            path?: string;
            _headers?: Record<string, string>;
          };

          if (clientReq.path) {
            const urlPath = clientReq.path.split('?')[0];
            span.setAttribute('url.path', urlPath);
            span.setAttribute('http.target', clientReq.path);
          }

          // Также пробуем извлечь из заголовка host
          const host = clientReq.getHeader?.('host') || clientReq._headers?.host;
          if (host && clientReq.path) {
            const protocol = clientReq.protocol || 'http:';
            try {
              const url = new URL(`${protocol}//${host}${clientReq.path}`);
              span.setAttribute('url.path', url.pathname);
            } catch {
              // Игнорируем ошибки парсинга URL
            }
          }

          span.updateName(`${clientReq.method} ${clientReq.path}`);
        }
      },
      responseHook: (span: Span, response: HttpResponse) => {
        if ('statusCode' in response && response.statusCode) {
          span.setAttribute('http.status_code', response.statusCode);
          span.setAttribute('http.response.status_code', response.statusCode);
        }
      },
    },
    '@opentelemetry/instrumentation-undici': {
      enabled: true,
      requestHook: (span: Span, request: { origin?: string; path?: string; method?: string }) => {
        if (request.path) {
          const urlPath = request.path.split('?')[0];
          span.setAttribute('http.route', urlPath);
          span.setAttribute('url.path', urlPath);
          span.updateName(`${request.method} ${urlPath}`);
        }
      },
    },
  };
}
