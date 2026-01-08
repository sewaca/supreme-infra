import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Span } from '@opentelemetry/api';
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
      requestHook: (span: Span, request: HttpRequest) => {
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
              // Игнорируем ошибки парсинга URL
            }
          }

          span.updateName(`${clientReq.method} ${clientReq.path}`);
        }
      },
      responseHook: (span: Span, response: HttpResponse) => {
        if ('statusCode' in response && response.statusCode) {
          span.setAttribute('http.status_code', response.statusCode);
        }
      },
    },
  };
}
