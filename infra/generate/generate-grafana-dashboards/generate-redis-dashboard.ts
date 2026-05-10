import * as fs from 'node:fs';
import * as path from 'node:path';

const DATASOURCE = { type: 'prometheus', uid: 'VictoriaMetrics' };

const TIMESERIES_FIELD_CONFIG_BASE = {
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
  },
  overrides: [],
};

const TIMESERIES_OPTIONS = {
  legend: { calcs: [], displayMode: 'list', placement: 'bottom', showLegend: true },
  tooltip: { mode: 'multi', sort: 'none' },
};

function target(expr: string, legendFormat: string, refId: string, instant = false) {
  return { datasource: DATASOURCE, editorMode: 'code', expr, legendFormat, range: !instant, instant, refId };
}

function rowPanel(id: number, title: string, y: number, collapsed = false, panels: unknown[] = []) {
  return { id, title, type: 'row', gridPos: { h: 1, w: 24, x: 0, y }, collapsed, panels };
}

function statPanel(
  id: number,
  title: string,
  expr: string,
  unit: string,
  x: number,
  y: number,
  w = 4,
  h = 4,
  colorMode = 'background',
  thresholds = { mode: 'absolute', steps: [{ color: 'green', value: null as null }] },
) {
  return {
    id,
    title,
    type: 'stat',
    datasource: DATASOURCE,
    gridPos: { h, w, x, y },
    targets: [target(expr, '', 'A', true)],
    fieldConfig: {
      defaults: {
        color: { mode: 'thresholds' },
        mappings: [],
        thresholds,
        unit,
      },
      overrides: [],
    },
    options: {
      colorMode,
      graphMode: 'none',
      justifyMode: 'auto',
      orientation: 'auto',
      reduceOptions: { calcs: ['lastNotNull'], fields: '', values: false },
      textMode: 'auto',
    },
  };
}

function timeseriesPanel(
  id: number,
  title: string,
  targets: ReturnType<typeof target>[],
  unit: string,
  x: number,
  y: number,
  w = 12,
  h = 8,
) {
  return {
    id,
    title,
    type: 'timeseries',
    datasource: DATASOURCE,
    gridPos: { h, w, x, y },
    targets,
    fieldConfig: {
      ...TIMESERIES_FIELD_CONFIG_BASE,
      defaults: { ...TIMESERIES_FIELD_CONFIG_BASE.defaults, unit },
    },
    options: TIMESERIES_OPTIONS,
  };
}

function discoverRedisInstances(projectRoot: string): string[] {
  const redisDir = path.join(projectRoot, 'infra/redis');
  if (!fs.existsSync(redisDir)) return [];
  return fs
    .readdirSync(redisDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(redisDir, e.name, 'service.yaml')))
    .map((e) => e.name);
}

function buildRedisDashboard(instanceName: string): object {
  const s = `service="${instanceName}"`;
  const panels: unknown[] = [];
  let id = 1;
  let y = 0;

  // ── Overview row ──────────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Overview', y++));

  panels.push(
    statPanel(id++, 'Uptime', `redis_uptime_in_seconds{${s}} / 3600`, 'h', 0, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [{ color: 'green', value: null }],
    }),
  );
  panels.push(
    statPanel(id++, 'Connected Clients', `redis_connected_clients{${s}}`, 'short', 4, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [
        { color: 'green', value: null },
        { color: 'yellow', value: 50 },
        { color: 'red', value: 100 },
      ],
    }),
  );
  panels.push(
    statPanel(id++, 'Memory Used', `redis_memory_used_bytes{${s}}`, 'bytes', 8, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [{ color: 'green', value: null }],
    }),
  );
  panels.push(
    statPanel(
      id++,
      'Hit Rate',
      `rate(redis_keyspace_hits_total{${s}}[5m]) / (rate(redis_keyspace_hits_total{${s}}[5m]) + rate(redis_keyspace_misses_total{${s}}[5m])) * 100 or on() vector(0)`,
      'percent',
      12,
      y,
      4,
      4,
      'background',
      {
        mode: 'absolute',
        steps: [
          { color: 'red', value: null },
          { color: 'yellow', value: 80 },
          { color: 'green', value: 95 },
        ],
      },
    ),
  );
  panels.push(
    statPanel(id++, 'Commands/sec', `redis_instantaneous_ops_per_sec{${s}}`, 'ops', 16, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [{ color: 'green', value: null }],
    }),
  );
  panels.push(
    statPanel(id++, 'Total Keys', `sum(redis_db_keys{${s}}) or on() vector(0)`, 'short', 20, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [{ color: 'green', value: null }],
    }),
  );
  y += 4;

  // ── Memory row ────────────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Memory', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Memory Usage',
      [
        target(`redis_memory_used_bytes{${s}}`, 'Used', 'A'),
        target(`redis_memory_max_bytes{${s}}`, 'Max', 'B'),
        target(`redis_memory_rss_bytes{${s}}`, 'RSS', 'C'),
      ],
      'bytes',
      0,
      y,
      12,
      8,
    ),
  );
  panels.push(
    timeseriesPanel(
      id++,
      'Memory Fragmentation Ratio',
      [target(`redis_mem_fragmentation_ratio{${s}}`, 'Fragmentation', 'A')],
      'short',
      12,
      y,
      12,
      8,
    ),
  );
  y += 8;

  // ── Performance row ───────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Performance', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Commands per Second',
      [target(`rate(redis_commands_processed_total{${s}}[1m])`, 'Commands/sec', 'A')],
      'ops',
      0,
      y,
      12,
      8,
    ),
  );
  panels.push(
    timeseriesPanel(
      id++,
      'Hit Rate',
      [
        target(
          `rate(redis_keyspace_hits_total{${s}}[5m]) / (rate(redis_keyspace_hits_total{${s}}[5m]) + rate(redis_keyspace_misses_total{${s}}[5m])) * 100 or on() vector(0)`,
          'Hit Rate %',
          'A',
        ),
      ],
      'percent',
      12,
      y,
      12,
      8,
    ),
  );
  y += 8;

  // ── Keyspace row ──────────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Keyspace', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Keyspace Hits vs Misses',
      [
        target(`rate(redis_keyspace_hits_total{${s}}[1m])`, 'Hits/sec', 'A'),
        target(`rate(redis_keyspace_misses_total{${s}}[1m])`, 'Misses/sec', 'B'),
      ],
      'ops',
      0,
      y,
      12,
      8,
    ),
  );
  panels.push(
    timeseriesPanel(id++, 'Keys per DB', [target(`redis_db_keys{${s}}`, '{{db}}', 'A')], 'short', 12, y, 12, 8),
  );
  y += 8;

  // ── Clients row ───────────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Clients', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Connected Clients',
      [target(`redis_connected_clients{${s}}`, 'Connected', 'A')],
      'short',
      0,
      y,
      12,
      8,
    ),
  );
  panels.push(
    timeseriesPanel(
      id++,
      'Blocked Clients',
      [target(`redis_blocked_clients{${s}}`, 'Blocked', 'A')],
      'short',
      12,
      y,
      12,
      8,
    ),
  );

  return {
    annotations: {
      list: [
        {
          builtIn: 1,
          datasource: { type: 'grafana', uid: '-- Grafana --' },
          enable: true,
          hide: true,
          iconColor: 'rgba(0, 211, 255, 1)',
          name: 'Annotations & Alerts',
          type: 'dashboard',
        },
      ],
    },
    editable: true,
    fiscalYearStartMonth: 0,
    graphTooltip: 0,
    id: null,
    links: [],
    panels,
    preload: false,
    refresh: '30s',
    schemaVersion: 40,
    tags: [instanceName, 'redis', 'infrastructure'],
    templating: { list: [] },
    time: { from: 'now-1h', to: 'now' },
    timepicker: {},
    timezone: 'browser',
    title: `${instanceName} Redis Metrics`,
    uid: `${instanceName}-redis-metrics`,
    version: 1,
    weekStart: '',
  };
}

export function generateRedisDashboards(): void {
  const projectRoot = path.join(__dirname, '../../..');
  const dashboardsDir = path.join(projectRoot, 'infra/helmcharts/grafana/dashboards');

  const instances = discoverRedisInstances(projectRoot);

  if (instances.length === 0) {
    console.log('⚠  No Redis instances found in infra/redis/');
    return;
  }

  for (const instanceName of instances) {
    const dashboard = buildRedisDashboard(instanceName);
    const outputPath = path.join(dashboardsDir, `${instanceName}-redis-metrics.json`);
    fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2), 'utf-8');
    console.log(`✓ Generated Redis dashboard: ${path.relative(process.cwd(), outputPath)}`);
  }
}
