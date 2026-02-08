import type { Counter } from '@opentelemetry/api';
import type { Logger } from '@opentelemetry/api-logs';
import { SeverityNumber } from '@opentelemetry/api-logs';

/**
 * Контекст ошибки запроса от Next.js
 */
export interface RequestErrorContext {
  routerKind: 'Pages Router' | 'App Router';
  routePath?: string;
  routeType?: 'render' | 'route' | 'action' | 'middleware';
  renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
  revalidateReason?: string;
}

/**
 * Информация о запросе
 * Совместим с Next.js RequestInfo из onRequestError
 */
export interface RequestInfo {
  path: string;
  method: string;
  headers?: unknown; // Делаем опциональным и гибким, так как тип может отличаться
}

/**
 * Атрибуты для метрик и логов HTTP запросов
 * Следует семантическим конвенциям OpenTelemetry для HTTP
 */
export interface HttpRequestAttributes {
  // Стандартные HTTP атрибуты (OpenTelemetry semantic conventions)
  'http.request.method': string;
  'http.response.status_code': number;
  'http.route'?: string;
  'url.path': string;
  'url.scheme'?: string;
  
  // Next.js специфичные атрибуты
  'next.route_kind': string;
  'next.route_path'?: string;
  'next.route_type'?: string;
  'next.render_source'?: string;
  'next.revalidate_reason'?: string;
  
  // Атрибуты ошибки (только для ошибок)
  'error.type'?: string;
  'error.message'?: string;
  'error.digest'?: string;
  
  // Index signature для совместимости с OpenTelemetry Attributes
  [key: string]: string | number | boolean | undefined;
}

/**
 * Конфигурация для обработчика ошибок запросов
 */
export interface RequestErrorHandlerConfig {
  logger: Logger;
  errorCounter: Counter;
  serviceName: string;
}

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
    const routeParts = parts.map((part, index) => {
      if (index < 2) return part; // Пропускаем '', 'api'
      
      // Заменяем ID на параметры
      if (/^\d+$/.test(part)) return ':id';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) return ':uuid';
      
      return part;
    });
    return routeParts.join('/');
  }
  
  // Для обычных роутов
  const parts = normalized.split('/');
  const routeParts = parts.map((part, index) => {
    if (index === 0) return part;
    
    if (/^\d+$/.test(part)) return ':id';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) return ':uuid';
    
    return part;
  });
  
  return routeParts.join('/');
}

/**
 * Создает атрибуты для HTTP запроса согласно семантическим конвенциям OpenTelemetry
 */
export function createHttpRequestAttributes(
  request: RequestInfo,
  context: RequestErrorContext,
  statusCode: number,
  error?: Error & { digest?: string },
): HttpRequestAttributes {
  const route = normalizeRoute(request.path);
  
  const attributes: HttpRequestAttributes = {
    // Стандартные HTTP атрибуты
    'http.request.method': request.method,
    'http.response.status_code': statusCode,
    'http.route': route,
    'url.path': request.path,
    
    // Next.js атрибуты
    'next.route_kind': context.routerKind,
  };

  // Добавляем опциональные атрибуты
  if (context.routePath) {
    attributes['next.route_path'] = context.routePath;
  }

  if (context.routeType) {
    attributes['next.route_type'] = context.routeType;
  }

  if (context.renderSource) {
    attributes['next.render_source'] = context.renderSource;
  }

  if (context.revalidateReason) {
    attributes['next.revalidate_reason'] = context.revalidateReason;
  }

  // Добавляем атрибуты ошибки, если есть
  if (error) {
    attributes['error.type'] = error.name;
    attributes['error.message'] = error.message;

    if (error.digest) {
      attributes['error.digest'] = error.digest;
    }
  }

  return attributes;
}

/**
 * Обрабатывает ошибку запроса: логирует и записывает метрики
 */
export function handleRequestError(
  config: RequestErrorHandlerConfig,
  err: unknown,
  request: RequestInfo,
  context: RequestErrorContext,
): void {
  const { logger, errorCounter, serviceName } = config;

  // Приводим err к Error для безопасной работы
  const error = err instanceof Error ? err : new Error(String(err));
  const digest =
    err && typeof err === 'object' && 'digest' in err && typeof err.digest === 'string' ? err.digest : undefined;

  // Создаем расширенный объект ошибки с digest
  const errorWithDigest = Object.assign(error, { digest });

  // Создаем атрибуты согласно семантическим конвенциям
  const attributes = createHttpRequestAttributes(request, context, 500, errorWithDigest);

  // Логируем ошибку с контекстом
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    body: JSON.stringify({
      service: serviceName,
      message: error.message,
      digest,
      stack: error.stack,
      request: {
        path: request.path,
        method: request.method,
      },
      context: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        renderSource: context.renderSource,
        revalidateReason: context.revalidateReason,
      },
    }),
    attributes,
  });

  // Записываем метрику ошибки
  errorCounter.add(1, attributes);

  // Также логируем в консоль для отладки
  console.error('[handleRequestError]', {
    service: serviceName,
    message: error.message,
    digest,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
  });
}
