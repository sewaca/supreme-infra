import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

interface Route {
  path: string;
  method: string;
}

interface RouterConfig {
  service: string;
  type: 'nest' | 'next' | 'fastapi';
  routes: Route[];
}

interface GrafanaPanelTarget {
  datasource?: { type: string; uid: string };
  editorMode: string;
  expr: string;
  legendFormat: string;
  range: boolean;
  refId: string;
  hide?: boolean;
  instant?: boolean;
}

interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  datasource?: { type: string; uid: string };
  gridPos: { h: number; w: number; x: number; y: number };
  targets?: GrafanaPanelTarget[];
  fieldConfig?: Record<string, unknown>;
  options?: Record<string, unknown>;
  collapsed?: boolean;
  panels?: GrafanaPanel[];
  [key: string]: unknown;
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
 * Возвращает фильтр исключения статус-чеков (liveness/readiness probes)
 */
function getStatusCheckExcludeFilter(routeLabelKey: 'http_route' | 'http_target'): string {
  if (routeLabelKey === 'http_target') {
    return `http_target!~".*/status$"`;
  }
  return `http_route!~".*/(api/)?status$"`;
}

/**
 * Возвращает фильтр включения только статус-чеков
 */
function getStatusCheckIncludeFilter(routeLabelKey: 'http_route' | 'http_target'): string {
  if (routeLabelKey === 'http_target') {
    return `http_target=~".*/status$"`;
  }
  return `http_route=~".*/(api/)?status$"`;
}

/**
 * Обновляет targets панели таймингов с корректной формулой histogram_quantile
 */
function updateTimingPanelTargets(
  panel: GrafanaPanel,
  serviceName: string,
  metricName: string,
  statusExcludeFilter: string,
  byPod: boolean,
): void {
  const datasource = panel.targets?.[0]?.datasource ?? { type: 'prometheus', uid: 'VictoriaMetrics' };
  const byClause = byPod ? 'le, pod' : 'le';
  const percentiles = [
    { p: '0.80', refId: 'A', legend: byPod ? 'P80 {{pod}}' : 'P80' },
    { p: '0.95', refId: 'B', legend: byPod ? 'P95 {{pod}}' : 'P95' },
    { p: '0.99', refId: 'C', legend: byPod ? 'P99 {{pod}}' : 'P99' },
  ];

  panel.targets = percentiles.map(({ p, refId, legend }) => ({
    datasource,
    editorMode: 'code',
    expr: `histogram_quantile(${p}, sum(rate(${metricName}_bucket{service="${serviceName}",${statusExcludeFilter}}[5m])) by (${byClause})) or on() vector(0)`,
    legendFormat: legend,
    range: true,
    refId,
  }));
}

/**
 * Обновляет targets панели RPS, добавляя фильтр исключения статус-чеков
 */
function updateRpsPanelTargets(
  panel: GrafanaPanel,
  serviceName: string,
  metricName: string,
  statusExcludeFilter: string,
  type: 'or' | 'bad',
  byPod: boolean,
): void {
  const datasource = panel.targets?.[0]?.datasource ?? { type: 'prometheus', uid: 'VictoriaMetrics' };
  const statusFilter = type === 'or' ? `http_status_code=~"2..|3.."` : `http_status_code=~"[45].."`;
  const byClause = byPod ? 'http_status_code, pod' : 'http_status_code';
  let legendFormat: string;
  if (byPod) {
    legendFormat = type === 'or' ? '{{http_status_code}} from {{pod}}' : '{{http_status_code}} by {{pod}}';
  } else {
    legendFormat = type === 'or' ? '{{http_status_code}}' : '__auto';
  }

  panel.targets = [
    {
      datasource,
      editorMode: 'code',
      expr: `sum(rate(${metricName}_count{service="${serviceName}", ${statusFilter}, ${statusExcludeFilter}}[1m])) by (${byClause}) or on() vector(0)`,
      legendFormat,
      range: true,
      refId: 'A',
    },
  ];
}

/**
 * Обновляет панели в секциях Main и By POD:
 * - исправляет формулу histogram_quantile в панелях таймингов
 * - добавляет фильтр исключения статус-чеков в RPS панели
 */
function updateMainAndByPodPanels(
  panels: GrafanaPanel[],
  serviceName: string,
  metricName: string,
  statusExcludeFilter: string,
): void {
  for (const panel of panels) {
    if (panel.type === 'row') continue;
    const title = (panel.title ?? '').toLowerCase();

    if (title.includes('timing')) {
      const byPod = title.includes('pod');
      updateTimingPanelTargets(panel, serviceName, metricName, statusExcludeFilter, byPod);
    } else if (title.includes('or rps') || title.includes('or prs')) {
      const byPod = title.includes('pod');
      updateRpsPanelTargets(panel, serviceName, metricName, statusExcludeFilter, 'or', byPod);
    } else if (title.includes('bad rps')) {
      const byPod = title.includes('pod');
      updateRpsPanelTargets(panel, serviceName, metricName, statusExcludeFilter, 'bad', byPod);
    }
  }
}

const rpsFieldConfigBase = {
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
};

const rpsOptions = {
  legend: { calcs: [], displayMode: 'list', placement: 'bottom', showLegend: true },
  tooltip: { mode: 'multi', sort: 'none' },
};

/**
 * Создает свёрнутую (collapsed) панель строки "Status Checks" с RPS панелями
 */
function createStatusChecksRowPanel(
  serviceName: string,
  metricName: string,
  statusIncludeFilter: string,
  startPanelId: number,
  startY: number,
): { panel: GrafanaPanel; nextPanelId: number } {
  let panelId = startPanelId;
  const datasource = { type: 'prometheus', uid: 'VictoriaMetrics' };

  const okRpsPanel: GrafanaPanel = {
    id: panelId++,
    title: 'Status Checks - OK RPS',
    type: 'timeseries',
    datasource,
    gridPos: { h: 8, w: 12, x: 0, y: startY + 1 },
    targets: [
      {
        datasource,
        editorMode: 'code',
        expr: `sum(rate(${metricName}_count{service="${serviceName}", http_status_code=~"2..|3..", ${statusIncludeFilter}}[1m])) by (http_status_code) or on() vector(0)`,
        legendFormat: '{{http_status_code}}',
        range: true,
        refId: 'A',
      },
    ],
    fieldConfig: rpsFieldConfigBase,
    options: rpsOptions,
  };

  const badRpsPanel: GrafanaPanel = {
    id: panelId++,
    title: 'Status Checks - Bad RPS',
    type: 'timeseries',
    datasource,
    gridPos: { h: 8, w: 12, x: 12, y: startY + 1 },
    targets: [
      {
        datasource,
        editorMode: 'code',
        expr: `sum(rate(${metricName}_count{service="${serviceName}", http_status_code=~"[45]..", ${statusIncludeFilter}}[1m])) by (http_status_code) or on() vector(0)`,
        legendFormat: '__auto',
        range: true,
        refId: 'A',
      },
    ],
    fieldConfig: {
      defaults: {
        ...(rpsFieldConfigBase.defaults as Record<string, unknown>),
        thresholds: {
          mode: 'absolute',
          steps: [
            { color: 'green', value: null },
            { color: 'red', value: 1 },
          ],
        },
      },
      overrides: [],
    },
    options: rpsOptions,
  };

  const rowPanel: GrafanaPanel = {
    collapsed: true,
    gridPos: { h: 1, w: 24, x: 0, y: startY },
    id: panelId++,
    panels: [okRpsPanel, badRpsPanel],
    title: 'Status Checks',
    type: 'row',
  };

  return { panel: rowPanel, nextPanelId: panelId };
}

/**
 * Создает панель для таймингов роута
 */
function createTimingsPanel(
  route: Route,
  serviceName: string,
  panelId: number,
  gridPos: { x: number; y: number },
  routeLabelKey: 'http_route' | 'http_target' = 'http_route',
): GrafanaPanel {
  const normalizedRoute = normalizeRouteForMetrics(route.path);
  const routeFilter = `${routeLabelKey}="${normalizedRoute}"`;
  const methodFilter = `http_method="${route.method}"`;
  const metricName = routeLabelKey === 'http_target' ? 'http_server_duration_milliseconds' : 'http_server_duration';

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
        expr: `histogram_quantile(0.50, sum(rate(${metricName}_bucket{service="${serviceName}",${routeFilter},${methodFilter}}[5m])) by (le)) or on() vector(0)`,
        legendFormat: 'P50',
        range: true,
        refId: 'A',
      },
      {
        datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
        editorMode: 'code',
        expr: `histogram_quantile(0.95, sum(rate(${metricName}_bucket{service="${serviceName}",${routeFilter},${methodFilter}}[5m])) by (le)) or on() vector(0)`,
        legendFormat: 'P95',
        range: true,
        refId: 'B',
      },
      {
        datasource: { type: 'prometheus', uid: 'VictoriaMetrics' },
        editorMode: 'code',
        expr: `histogram_quantile(0.99, sum(rate(${metricName}_bucket{service="${serviceName}",${routeFilter},${methodFilter}}[5m])) by (le)) or on() vector(0)`,
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
  routeLabelKey: 'http_route' | 'http_target' = 'http_route',
): GrafanaPanel {
  const normalizedRoute = normalizeRouteForMetrics(route.path);
  const routeFilter = `${routeLabelKey}="${normalizedRoute}"`;
  const methodFilter = `http_method="${route.method}"`;
  const metricName = routeLabelKey === 'http_target' ? 'http_server_duration_milliseconds' : 'http_server_duration';

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
        expr: `sum(rate(${metricName}_count{service="${serviceName}",${routeFilter},${methodFilter},http_status_code=~"2..|3.."}[1m])) or on() vector(0)`,
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
  routeLabelKey: 'http_route' | 'http_target' = 'http_route',
): GrafanaPanel {
  const normalizedRoute = normalizeRouteForMetrics(route.path);
  const routeFilter = `${routeLabelKey}="${normalizedRoute}"`;
  const methodFilter = `http_method="${route.method}"`;
  const metricName = routeLabelKey === 'http_target' ? 'http_server_duration_milliseconds' : 'http_server_duration';

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
        expr: `sum(rate(${metricName}_count{service="${serviceName}",${routeFilter},${methodFilter},http_status_code=~"[45].."}[1m])) or on() vector(0)`,
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
  routeLabelKey: 'http_route' | 'http_target' = 'http_route',
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
  panels.push(createRowPanel(`${route.method} ${route.path}`, panelId++, y++));

  // Панели в одной строке: Timings | OK RPS | Bad RPS
  panels.push(createTimingsPanel(route, serviceName, panelId++, { x: 0, y }, routeLabelKey));
  panels.push(createOkRpsPanel(route, serviceName, panelId++, { x: 8, y }, routeLabelKey));
  panels.push(createBadRpsPanel(route, serviceName, panelId++, { x: 16, y }, routeLabelKey));

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

  const routeLabelKey = routerConfig.type === 'fastapi' ? 'http_target' : 'http_route';
  const metricName = routeLabelKey === 'http_target' ? 'http_server_duration_milliseconds' : 'http_server_duration';
  const statusExcludeFilter = getStatusCheckExcludeFilter(routeLabelKey);
  const statusIncludeFilter = getStatusCheckIncludeFilter(routeLabelKey);

  // Группируем панели по секциям на основе row панелей
  const mainPanels: GrafanaPanel[] = [];
  const byPodPanels: GrafanaPanel[] = [];
  const nodejsPanels: GrafanaPanel[] = [];

  let currentSection: 'main' | 'bypod' | 'nodejs' | 'routes' | 'status_checks' | 'other' = 'other';

  for (const panel of dashboard.panels) {
    const title = panel.title?.toLowerCase() || '';

    // Определяем секцию по row панели
    if (panel.type === 'row') {
      if (title.includes('main')) {
        currentSection = 'main';
        mainPanels.push(panel);
      } else if (title.includes('by pod')) {
        currentSection = 'bypod';
        byPodPanels.push(panel);
      } else if (title.includes('node js') || title.includes('nodejs') || title.includes('python')) {
        currentSection = 'nodejs';
        nodejsPanels.push(panel);
      } else if (title.includes('route')) {
        currentSection = 'routes';
        // Пропускаем старые route панели — будут пересозданы
      } else if (title.includes('status check')) {
        currentSection = 'status_checks';
        // Пропускаем старые status checks панели — будут пересозданы
      } else {
        currentSection = 'other';
      }
    } else {
      // Добавляем панель в соответствующую секцию
      if (currentSection === 'main') {
        mainPanels.push(panel);
      } else if (currentSection === 'bypod') {
        byPodPanels.push(panel);
      } else if (currentSection === 'nodejs') {
        nodejsPanels.push(panel);
      }
      // Пропускаем панели из секций routes, status_checks и other
    }
  }

  // Обновляем PromQL в main и bypod панелях
  updateMainAndByPodPanels(mainPanels, serviceName, metricName, statusExcludeFilter);
  updateMainAndByPodPanels(byPodPanels, serviceName, metricName, statusExcludeFilter);

  // Пересчитываем позиции для всех панелей
  let currentY = 0;

  // 1. Main секция
  for (const panel of mainPanels) {
    if (panel.gridPos) {
      panel.gridPos.y = currentY;
      currentY += panel.gridPos.h || 1;
    }
  }

  // 2. By POD секция
  for (const panel of byPodPanels) {
    if (panel.gridPos) {
      panel.gridPos.y = currentY;
      currentY += panel.gridPos.h || 1;
    }
  }

  // 3. Node JS секция
  for (const panel of nodejsPanels) {
    if (panel.gridPos) {
      panel.gridPos.y = currentY;
      currentY += panel.gridPos.h || 1;
    }
  }

  // 4. Генерируем свёрнутую секцию Status Checks
  let nextPanelId = Math.max(...dashboard.panels.map((p: GrafanaPanel) => p.id || 0)) + 1;

  const statusChecksResult = createStatusChecksRowPanel(
    serviceName,
    metricName,
    statusIncludeFilter,
    nextPanelId,
    currentY,
  );
  nextPanelId = statusChecksResult.nextPanelId;
  currentY += 1; // Collapsed row занимает 1 строку

  // 5. Генерируем новые панели для роутов
  const routePanels: GrafanaPanel[] = [];

  // Добавляем row для роутов
  routePanels.push(createRowPanel('Routes Metrics', nextPanelId++, currentY++));

  // Генерируем панели для каждого роута
  for (const route of routerConfig.routes) {
    const result = generateRoutePanels(route, serviceName, nextPanelId, currentY, routeLabelKey);
    routePanels.push(...result.panels);
    nextPanelId = result.nextPanelId;
    currentY = result.nextY;
  }

  // Объединяем панели в правильном порядке: Main → By POD → Node JS → Status Checks → Routes
  dashboard.panels = [...mainPanels, ...byPodPanels, ...nodejsPanels, statusChecksResult.panel, ...routePanels];

  // Сохраняем обновленный дашборд
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2), 'utf-8');

  const relativePath = path.relative(process.cwd(), dashboardPath);
  console.log(`✓ Updated Grafana dashboard: ${relativePath}`);
  console.log(`  Added ${routePanels.length} panels for ${routerConfig.routes.length} routes`);
}
