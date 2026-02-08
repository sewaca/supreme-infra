import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

interface Route {
  path: string;
  method: string;
}

interface RouterConfig {
  service: string;
  type: 'nest' | 'next';
  routes: Route[];
}

interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  datasource: { type: string; uid: string };
  gridPos: { h: number; w: number; x: number; y: number };
  targets: Array<{
    datasource: { type: string; uid: string };
    editorMode: string;
    expr: string;
    legendFormat: string;
    range: boolean;
    refId: string;
  }>;
  fieldConfig: Record<string, unknown>;
  options: Record<string, unknown>;
}

/**
 * Нормализует путь роута для использования в метриках
 * Преобразует роуты из router.yaml в формат, используемый в метриках
 *
 * Примеры:
 * - /api/500 -> /api/500
 * - /profile -> /profile
 * - /web-profile-ssr/.* -> /_next/* (статические файлы Next.js)
 * - /profile/[^/]+ -> /profile/:id (динамические сегменты)
 */
function normalizeRouteForMetrics(routePath: string): string {
  // Статические файлы Next.js
  if (routePath.includes('/_next/') || routePath.endsWith('/.*')) {
    return '/_next/*';
  }

  // Убираем regex паттерны и заменяем на параметры
  let normalized = routePath;

  // [^/]+ -> :id (динамические сегменты)
  normalized = normalized.replace(/\/\[\^\/\]\+/g, '/:id');

  // .* в конце пути
  normalized = normalized.replace(/\/\.\*$/g, '/*');

  // .+ в конце пути
  normalized = normalized.replace(/\/\.\+$/g, '/*');

  return normalized;
}

/**
 * Создает панель для таймингов роута
 */
function createTimingsPanel(
  route: Route,
  serviceName: string,
  panelId: number,
  gridPos: { x: number; y: number },
): GrafanaPanel {
  const normalizedRoute = normalizeRouteForMetrics(route.path);
  const routeFilter = `http_route="${normalizedRoute}"`;
  const methodFilter = `http_method="${route.method}"`;

  return {
    id: panelId,
    title: `${route.method} ${normalizedRoute} - Timings`,
    type: 'timeseries',
    datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
    gridPos: { h: 8, w: 8, x: gridPos.x, y: gridPos.y },
    targets: [
      {
        datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
        editorMode: 'code',
        expr: `histogram_quantile(0.50, sum(rate(http_server_duration_bucket{service="${serviceName}",${routeFilter},${methodFilter}}[5m])) by (le)) or on() vector(0)`,
        legendFormat: 'P50',
        range: true,
        refId: 'A',
      },
      {
        datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
        editorMode: 'code',
        expr: `histogram_quantile(0.95, sum(rate(http_server_duration_bucket{service="${serviceName}",${routeFilter},${methodFilter}}[5m])) by (le)) or on() vector(0)`,
        legendFormat: 'P95',
        range: true,
        refId: 'B',
      },
      {
        datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
        editorMode: 'code',
        expr: `histogram_quantile(0.99, sum(rate(http_server_duration_bucket{service="${serviceName}",${routeFilter},${methodFilter}}[5m])) by (le)) or on() vector(0)`,
        legendFormat: 'P99',
        range: true,
        refId: 'C',
      },
    ],
    fieldConfig: {
      defaults: {
        color: { mode: 'palette-classic' },
        custom: {
          axisBorderShow: false,
          axisCenteredZero: false,
          axisColorMode: 'text',
          axisLabel: '',
          axisPlacement: 'auto',
          barAlignment: 0,
          drawStyle: 'line',
          fillOpacity: 10,
          gradientMode: 'none',
          hideFrom: { legend: false, tooltip: false, viz: false },
          insertNulls: false,
          lineInterpolation: 'linear',
          lineWidth: 1,
          pointSize: 5,
          scaleDistribution: { type: 'linear' },
          showPoints: 'never',
          spanNulls: false,
          stacking: { group: 'A', mode: 'none' },
          thresholdsStyle: { mode: 'off' },
        },
        mappings: [],
        thresholds: {
          mode: 'absolute',
          steps: [
            { color: 'green', value: null },
            { color: 'yellow', value: 500 },
            { color: 'red', value: 1000 },
          ],
        },
        unit: 'ms',
      },
      overrides: [],
    },
    options: {
      legend: { calcs: [], displayMode: 'list', placement: 'bottom', showLegend: true },
      tooltip: { mode: 'multi', sort: 'none' },
    },
  };
}

/**
 * Создает панель для OK RPS роута
 */
function createOkRpsPanel(
  route: Route,
  serviceName: string,
  panelId: number,
  gridPos: { x: number; y: number },
): GrafanaPanel {
  const normalizedRoute = normalizeRouteForMetrics(route.path);
  const routeFilter = `http_route="${normalizedRoute}"`;
  const methodFilter = `http_method="${route.method}"`;

  return {
    id: panelId,
    title: `${route.method} ${normalizedRoute} - OK RPS`,
    type: 'timeseries',
    datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
    gridPos: { h: 8, w: 8, x: gridPos.x, y: gridPos.y },
    targets: [
      {
        datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
        editorMode: 'code',
        expr: `sum(rate(http_server_duration_count{service="${serviceName}",${routeFilter},${methodFilter},http_status_code=~"2..|3.."}[1m])) or on() vector(0)`,
        legendFormat: 'OK (2xx/3xx)',
        range: true,
        refId: 'A',
      },
    ],
    fieldConfig: {
      defaults: {
        color: { mode: 'palette-classic' },
        custom: {
          axisBorderShow: false,
          axisCenteredZero: false,
          axisColorMode: 'text',
          axisLabel: '',
          axisPlacement: 'auto',
          barAlignment: 0,
          drawStyle: 'line',
          fillOpacity: 10,
          gradientMode: 'none',
          hideFrom: { legend: false, tooltip: false, viz: false },
          insertNulls: false,
          lineInterpolation: 'linear',
          lineWidth: 1,
          pointSize: 5,
          scaleDistribution: { type: 'linear' },
          showPoints: 'never',
          spanNulls: false,
          stacking: { group: 'A', mode: 'none' },
          thresholdsStyle: { mode: 'off' },
        },
        mappings: [],
        thresholds: { mode: 'absolute', steps: [{ color: 'green', value: null }] },
        unit: 'reqps',
      },
      overrides: [],
    },
    options: {
      legend: { calcs: [], displayMode: 'list', placement: 'bottom', showLegend: true },
      tooltip: { mode: 'multi', sort: 'none' },
    },
  };
}

/**
 * Создает панель для Bad RPS роута
 */
function createBadRpsPanel(
  route: Route,
  serviceName: string,
  panelId: number,
  gridPos: { x: number; y: number },
): GrafanaPanel {
  const normalizedRoute = normalizeRouteForMetrics(route.path);
  const routeFilter = `http_route="${normalizedRoute}"`;
  const methodFilter = `http_method="${route.method}"`;

  return {
    id: panelId,
    title: `${route.method} ${normalizedRoute} - Bad RPS`,
    type: 'timeseries',
    datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
    gridPos: { h: 8, w: 8, x: gridPos.x, y: gridPos.y },
    targets: [
      {
        datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
        editorMode: 'code',
        expr: `sum(rate(http_server_duration_count{service="${serviceName}",${routeFilter},${methodFilter},http_status_code=~"[45].."}[1m])) or on() vector(0)`,
        legendFormat: 'Errors (4xx/5xx)',
        range: true,
        refId: 'A',
      },
    ],
    fieldConfig: {
      defaults: {
        color: { mode: 'palette-classic' },
        custom: {
          axisBorderShow: false,
          axisCenteredZero: false,
          axisColorMode: 'text',
          axisLabel: '',
          axisPlacement: 'auto',
          barAlignment: 0,
          drawStyle: 'line',
          fillOpacity: 10,
          gradientMode: 'none',
          hideFrom: { legend: false, tooltip: false, viz: false },
          insertNulls: false,
          lineInterpolation: 'linear',
          lineWidth: 1,
          pointSize: 5,
          scaleDistribution: { type: 'linear' },
          showPoints: 'never',
          spanNulls: false,
          stacking: { group: 'A', mode: 'none' },
          thresholdsStyle: { mode: 'off' },
        },
        mappings: [],
        thresholds: {
          mode: 'absolute',
          steps: [
            { color: 'green', value: null },
            { color: 'red', value: 1 },
          ],
        },
        unit: 'reqps',
      },
      overrides: [],
    },
    options: {
      legend: { calcs: [], displayMode: 'list', placement: 'bottom', showLegend: true },
      tooltip: { mode: 'multi', sort: 'none' },
    },
  };
}

/**
 * Создает row панель для группировки роутов
 */
function createRowPanel(title: string, panelId: number, yPos: number): GrafanaPanel {
  return {
    id: panelId,
    title,
    type: 'row',
    gridPos: { h: 1, w: 24, x: 0, y: yPos },
  } as GrafanaPanel;
}

/**
 * Генерирует панели для роута
 */
export function generateRoutePanels(
  route: Route,
  serviceName: string,
  startPanelId: number,
  startY: number,
): { panels: GrafanaPanel[]; nextPanelId: number; nextY: number } {
  const panels: GrafanaPanel[] = [];
  let panelId = startPanelId;
  let y = startY;

  // Пропускаем статические файлы и служебные роуты
  if (
    route.path.includes('/_next/') ||
    route.path.endsWith('/.*') ||
    route.path.includes('/__nextjs') ||
    route.path.includes('/static/')
  ) {
    return { panels, nextPanelId: panelId, nextY: y };
  }

  // Row для роута
  panels.push(createRowPanel(`Route: ${route.method} ${route.path}`, panelId++, y++));

  // Панели в одной строке: Timings | OK RPS | Bad RPS
  panels.push(createTimingsPanel(route, serviceName, panelId++, { x: 0, y }));
  panels.push(createOkRpsPanel(route, serviceName, panelId++, { x: 8, y }));
  panels.push(createBadRpsPanel(route, serviceName, panelId++, { x: 16, y }));

  y += 8; // Высота панелей

  return { panels, nextPanelId: panelId, nextY: y };
}

/**
 * Обновляет Grafana дашборд для сервиса на основе router.yaml
 */
export function updateGrafanaDashboard(serviceName: string): void {
  const routerPath = path.join(__dirname, '../../../services', serviceName, 'router.yaml');
  const dashboardPath = path.join(__dirname, '../../helmcharts/grafana/dashboards', `${serviceName}-metrics.json`);

  // Читаем router.yaml
  if (!fs.existsSync(routerPath)) {
    console.log(`⚠ Router config not found: ${routerPath}`);
    return;
  }

  const routerContent = fs.readFileSync(routerPath, 'utf-8');
  const routerConfig: RouterConfig = yaml.parse(routerContent);

  // Читаем существующий дашборд
  if (!fs.existsSync(dashboardPath)) {
    console.log(`⚠ Dashboard not found: ${dashboardPath}`);
    return;
  }

  const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));

  // Находим существующие панели (не route-specific)
  const existingPanels = dashboard.panels.filter((panel: GrafanaPanel) => {
    const title = panel.title?.toLowerCase() || '';
    // Оставляем только общие панели (Main, By POD, Node JS и их содержимое)
    return (
      (panel.type === 'row' && (title.includes('main') || title.includes('by pod') || title.includes('node js'))) ||
      (panel.title &&
        !panel.title.includes('Route:') &&
        (title.includes('timing') || title.includes('rps') || title.includes('eventloop') || title.includes('memory')))
    );
  });

  // Генерируем новые панели для роутов
  const routePanels: GrafanaPanel[] = [];
  let nextPanelId = Math.max(...dashboard.panels.map((p: GrafanaPanel) => p.id || 0)) + 1;
  let nextY = Math.max(...existingPanels.map((p: GrafanaPanel) => (p.gridPos?.y || 0) + (p.gridPos?.h || 0))) + 1;

  // Добавляем row для роутов
  routePanels.push(createRowPanel('Routes Metrics', nextPanelId++, nextY++));

  // Генерируем панели для каждого роута
  for (const route of routerConfig.routes) {
    const result = generateRoutePanels(route, serviceName, nextPanelId, nextY);
    routePanels.push(...result.panels);
    nextPanelId = result.nextPanelId;
    nextY = result.nextY;
  }

  // Объединяем панели
  dashboard.panels = [...existingPanels, ...routePanels];

  // Сохраняем обновленный дашборд
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2), 'utf-8');

  const relativePath = path.relative(process.cwd(), dashboardPath);
  console.log(`✓ Updated Grafana dashboard: ${relativePath}`);
  console.log(`  Added ${routePanels.length} panels for ${routerConfig.routes.length} routes`);
}
