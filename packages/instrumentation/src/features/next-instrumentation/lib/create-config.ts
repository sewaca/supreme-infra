import type { ClientRequest, IncomingMessage, ServerResponse } from 'node:http';
import type { Span } from '@opentelemetry/api';
import type { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';

type HttpRequest = IncomingMessage | ClientRequest;
type HttpResponse = IncomingMessage | ServerResponse;

/**
 * Нормализует путь для использования в качестве http.route
 * Убирает динамические части (например, ID) для группировки метрик
 */
function normalizeRoute(urlPath: string): string {
  // Убираем query параметры
  const pathWithoutQuery = urlPath.split('?')[0];
  
  // Убираем trailing slash (кроме корневого пути)
  const normalized = pathWithoutQuery === '/' ? '/' : pathWithoutQuery.replace(/\/$/, '');
  
  // Для Next.js специфичных путей
  if (normalized.startsWith('/_next/')) {
    return '/_next/*';
  }
  
  if (normalized.startsWith('/api/')) {
    // Группируем API роуты
    const parts = normalized.split('/');
    // Заменяем потенциальные ID (числа, UUID) на параметры
    const routeParts = parts.map((part, index) => {
      // Пропускаем первые два элемента ('', 'api')
      if (index < 2) return part;
      
      // Проверяем, является ли часть ID (число или UUID)
      if (/^\d+$/.test(part)) return ':id';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) return ':uuid';
      
      return part;
    });
    return routeParts.join('/');
  }
  
  // Для обычных роутов Next.js
  const parts = normalized.split('/');
  const routeParts = parts.map((part, index) => {
    if (index === 0) return part; // Пустая строка для начального /
    
    // Заменяем потенциальные динамические сегменты
    if (/^\d+$/.test(part)) return ':id';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) return ':uuid';
    
    return part;
  });
  
  return routeParts.join('/');
}

/**
 * Создает конфигурацию инструментации для Next.js приложений
 * Настраивает трейсинг для HTTP запросов с правильной обработкой URL и http.route
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
          const route = normalizeRoute(urlPath);
          
          // Устанавливаем атрибуты согласно семантическим конвенциям
          span.setAttribute('http.route', route);
          span.setAttribute('url.path', urlPath);
          span.setAttribute('http.request.method', request.method || 'GET');
          
          span.updateName(`${request.method} ${route}`);
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
          span.setAttribute('http.response.status_code', response.statusCode);
          span.setAttribute('http.status_code', response.statusCode); // Для обратной совместимости
        }
      },
    },
  };
}
