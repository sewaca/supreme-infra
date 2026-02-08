import { InstrumentType, View } from '@opentelemetry/sdk-metrics';

/**
 * Создает Views для метрик HTTP сервера
 * Добавляет http.route в метрики для правильной группировки по роутам
 * Поддерживает как старые (http.server.duration), так и новые (http.server.request.duration) имена метрик
 *
 * @see https://github.com/open-telemetry/opentelemetry-js/issues/3862
 */
export function createHttpServerMetricViews(): View[] {
  return [
    // View для http.server.duration (старая конвенция) - добавляем http.route
    new View({
      instrumentName: 'http.server.duration',
      instrumentType: InstrumentType.HISTOGRAM,
      meterName: '@opentelemetry/instrumentation-http',
      // Добавляем http.route к атрибутам метрики
      attributeKeys: [
        'http.method',
        'http.status_code',
        'http.route',
        'http.scheme',
        'http.target',
        'net.host.name',
        'net.host.port',
      ],
    }),
    
    // View для http.server.request.duration (новая конвенция) - добавляем http.route
    new View({
      instrumentName: 'http.server.request.duration',
      instrumentType: InstrumentType.HISTOGRAM,
      meterName: '@opentelemetry/instrumentation-http',
      // Добавляем http.route к атрибутам метрики
      attributeKeys: [
        'http.request.method',
        'http.response.status_code',
        'http.route',
        'url.scheme',
        'server.address',
        'server.port',
      ],
    }),

    // View для http.server.active_requests - добавляем http.route
    new View({
      instrumentName: 'http.server.active_requests',
      instrumentType: InstrumentType.UP_DOWN_COUNTER,
      meterName: '@opentelemetry/instrumentation-http',
      attributeKeys: ['http.request.method', 'http.route', 'url.scheme', 'server.address', 'server.port'],
    }),
  ];
}

/**
 * Создает Views для всех метрик
 * Можно расширять для добавления других Views
 */
export function createMetricViews(): View[] {
  return [
    ...createHttpServerMetricViews(),
    // Здесь можно добавить другие Views при необходимости
  ];
}
