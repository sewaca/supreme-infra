import * as fs from 'node:fs';
import * as path from 'node:path';
import { getServicesByType } from '../shared/load-services';

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
      defaults: { color: { mode: 'thresholds' }, mappings: [], thresholds, unit },
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

function buildPostgresDashboard(serviceName: string, dbName: string): object {
  // service label in Victoria Metrics = app.kubernetes.io/name = nameOverride = postgresql-{serviceName}
  const svcLabel = `postgresql-${serviceName}`;
  const s = `service="${svcLabel}"`;
  const db = `datname="${dbName}"`;
  const sd = `${s}, ${db}`;

  const panels: unknown[] = [];
  let id = 1;
  let y = 0;

  // ── Overview row ──────────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Overview', y++));

  panels.push(
    statPanel(id++, 'Status', `pg_up{${s}}`, 'short', 0, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [
        { color: 'red', value: null },
        { color: 'green', value: 1 },
      ],
    }),
  );
  panels.push(
    statPanel(id++, 'Active Connections', `pg_stat_database_numbackends{${sd}}`, 'short', 4, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [
        { color: 'green', value: null },
        { color: 'yellow', value: 50 },
        { color: 'red', value: 90 },
      ],
    }),
  );
  panels.push(
    statPanel(id++, 'Database Size', `pg_database_size_bytes{${sd}}`, 'bytes', 8, y, 4, 4, 'background', {
      mode: 'absolute',
      steps: [{ color: 'green', value: null }],
    }),
  );
  panels.push(
    statPanel(
      id++,
      'TPS',
      `rate(pg_stat_database_xact_commit_total{${sd}}[5m]) + rate(pg_stat_database_xact_rollback_total{${sd}}[5m])`,
      'ops',
      12,
      y,
      4,
      4,
      'background',
      { mode: 'absolute', steps: [{ color: 'green', value: null }] },
    ),
  );
  panels.push(
    statPanel(
      id++,
      'Cache Hit Ratio',
      `rate(pg_stat_database_blks_hit_total{${sd}}[5m]) / (rate(pg_stat_database_blks_hit_total{${sd}}[5m]) + rate(pg_stat_database_blks_read_total{${sd}}[5m]) + 1) * 100`,
      'percent',
      16,
      y,
      4,
      4,
      'background',
      {
        mode: 'absolute',
        steps: [
          { color: 'red', value: null },
          { color: 'yellow', value: 90 },
          { color: 'green', value: 99 },
        ],
      },
    ),
  );
  panels.push(
    statPanel(
      id++,
      'Rollback Rate',
      `rate(pg_stat_database_xact_rollback_total{${sd}}[5m]) / (rate(pg_stat_database_xact_commit_total{${sd}}[5m]) + rate(pg_stat_database_xact_rollback_total{${sd}}[5m]) + 1) * 100`,
      'percent',
      20,
      y,
      4,
      4,
      'background',
      {
        mode: 'absolute',
        steps: [
          { color: 'green', value: null },
          { color: 'yellow', value: 1 },
          { color: 'red', value: 5 },
        ],
      },
    ),
  );
  y += 4;

  // ── Connections row ───────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Connections', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Active Connections',
      [target(`pg_stat_database_numbackends{${sd}}`, 'Active', 'A')],
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
      'Connection Usage %',
      [target(`pg_stat_database_numbackends{${sd}} / on() pg_settings_max_connections{${s}} * 100`, 'Usage %', 'A')],
      'percent',
      12,
      y,
      12,
      8,
    ),
  );
  y += 8;

  // ── Transactions row ──────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Transactions', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Commit Rate',
      [target(`rate(pg_stat_database_xact_commit_total{${sd}}[1m])`, 'Commits/sec', 'A')],
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
      'Rollback Rate',
      [target(`rate(pg_stat_database_xact_rollback_total{${sd}}[1m])`, 'Rollbacks/sec', 'A')],
      'ops',
      12,
      y,
      12,
      8,
    ),
  );
  y += 8;

  // ── Cache row ─────────────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Cache', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Cache Hit Ratio',
      [
        target(
          `rate(pg_stat_database_blks_hit_total{${sd}}[5m]) / (rate(pg_stat_database_blks_hit_total{${sd}}[5m]) + rate(pg_stat_database_blks_read_total{${sd}}[5m]) + 1) * 100`,
          'Hit Ratio %',
          'A',
        ),
      ],
      'percent',
      0,
      y,
      12,
      8,
    ),
  );
  panels.push(
    timeseriesPanel(
      id++,
      'Block Read vs Hit Rate',
      [
        target(`rate(pg_stat_database_blks_hit_total{${sd}}[1m])`, 'Cache Hits/sec', 'A'),
        target(`rate(pg_stat_database_blks_read_total{${sd}}[1m])`, 'Disk Reads/sec', 'B'),
      ],
      'ops',
      12,
      y,
      12,
      8,
    ),
  );
  y += 8;

  // ── Row Operations row ────────────────────────────────────────────────────
  panels.push(rowPanel(id++, 'Row Operations', y++));

  panels.push(
    timeseriesPanel(
      id++,
      'Inserts per Second',
      [target(`rate(pg_stat_database_tup_inserted_total{${sd}}[1m])`, 'Inserts/sec', 'A')],
      'ops',
      0,
      y,
      8,
      8,
    ),
  );
  panels.push(
    timeseriesPanel(
      id++,
      'Updates per Second',
      [target(`rate(pg_stat_database_tup_updated_total{${sd}}[1m])`, 'Updates/sec', 'A')],
      'ops',
      8,
      y,
      8,
      8,
    ),
  );
  panels.push(
    timeseriesPanel(
      id++,
      'Deletes per Second',
      [target(`rate(pg_stat_database_tup_deleted_total{${sd}}[1m])`, 'Deletes/sec', 'A')],
      'ops',
      16,
      y,
      8,
      8,
    ),
  );
  y += 8;

  // ── Table Health row (collapsed) ──────────────────────────────────────────
  const tableHealthPanels: unknown[] = [];
  let subId = id + 1;
  const subY = y + 1;

  tableHealthPanels.push({
    id: subId++,
    title: 'Dead Tuples by Table',
    type: 'timeseries',
    datasource: DATASOURCE,
    gridPos: { h: 8, w: 12, x: 0, y: subY },
    targets: [target(`pg_stat_user_tables_n_dead_tup{${s}}`, '{{relname}}', 'A')],
    fieldConfig: {
      ...TIMESERIES_FIELD_CONFIG_BASE,
      defaults: { ...TIMESERIES_FIELD_CONFIG_BASE.defaults, unit: 'short' },
    },
    options: TIMESERIES_OPTIONS,
  });
  tableHealthPanels.push({
    id: subId++,
    title: 'Sequential vs Index Scans',
    type: 'timeseries',
    datasource: DATASOURCE,
    gridPos: { h: 8, w: 12, x: 12, y: subY },
    targets: [
      target(`rate(pg_stat_user_tables_seq_scan_total{${s}}[5m])`, 'Seq Scans/sec {{relname}}', 'A'),
      target(`rate(pg_stat_user_tables_idx_scan_total{${s}}[5m])`, 'Idx Scans/sec {{relname}}', 'B'),
    ],
    fieldConfig: {
      ...TIMESERIES_FIELD_CONFIG_BASE,
      defaults: { ...TIMESERIES_FIELD_CONFIG_BASE.defaults, unit: 'ops' },
    },
    options: TIMESERIES_OPTIONS,
  });

  panels.push({
    id: id++,
    title: 'Table Health',
    type: 'row',
    gridPos: { h: 1, w: 24, x: 0, y },
    collapsed: true,
    panels: tableHealthPanels,
  });
  id = subId;

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
    tags: [serviceName, 'postgresql', 'infrastructure'],
    templating: { list: [] },
    time: { from: 'now-1h', to: 'now' },
    timepicker: {},
    timezone: 'browser',
    title: `${serviceName} PostgreSQL Metrics`,
    uid: `${serviceName}-db-metrics`,
    version: 1,
    weekStart: '',
  };
}

export function generatePostgresDashboards(): void {
  const dashboardsDir = path.join(__dirname, '../../../infra/helmcharts/grafana/dashboards');

  const allServices = [...getServicesByType('nest'), ...getServicesByType('fastapi')];

  const dbServices = allServices.filter((s) => s.database?.enabled);

  if (dbServices.length === 0) {
    console.log('⚠  No services with database.enabled found in services.yaml');
    return;
  }

  for (const service of dbServices) {
    const dbName = service.database?.name ?? `${service.name.replace(/-/g, '_')}_db`;
    const dashboard = buildPostgresDashboard(service.name, dbName);
    const outputPath = path.join(dashboardsDir, `${service.name}-db-metrics.json`);
    fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2), 'utf-8');
    console.log(`✓ Generated PostgreSQL dashboard: ${path.relative(process.cwd(), outputPath)}`);
  }
}
