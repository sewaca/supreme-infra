import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { loadServices } from '../shared/load-services';
import { extractFastapiRoutes } from './extract-fastapi-routes';
import { extractNestRoutes } from './extract-nest-routes';
import { extractNextRoutes } from './extract-next-routes';
import { updateGrafanaDashboard } from './generate-grafana-dashboard';

type AuthLevel = 'none' | 'valid';

interface Route {
  path: string;
  method: string;
  auth_level?: AuthLevel;
}

interface RouterConfig {
  service: string;
  type: 'nest' | 'next' | 'fastapi';
  routes: Route[];
}

function log(message: string, level: 'info' | 'success' | 'error' = 'info'): void {
  const prefix = {
    info: '→',
    success: '✓',
    error: '✗',
  };
  console.log(`${prefix[level]} ${message}`);
}

/** Read existing router.yaml and return a map of "path:method" → auth_level */
function loadExistingAuthLevels(outputPath: string): Map<string, AuthLevel> {
  const map = new Map<string, AuthLevel>();
  if (!fs.existsSync(outputPath)) return map;

  try {
    const content = fs.readFileSync(outputPath, 'utf-8');
    const parsed = yaml.parse(content) as RouterConfig | undefined;
    for (const route of parsed?.routes ?? []) {
      if (route.auth_level) {
        map.set(`${route.path}:${route.method ?? ''}`, route.auth_level);
      }
    }
  } catch {
    // ignore parse errors — start fresh
  }

  return map;
}

/** Generate _auth-routes.generated.ts at the service root (next to router.yaml) */
function generateAuthRoutesTs(servicePath: string, routes: Route[]): void {
  const lines: string[] = [
    '// AUTO-GENERATED from router.yaml — DO NOT EDIT',
    '// Run pnpm generate:router to regenerate',
    '',
    "export type AuthLevel = 'none' | 'valid';",
    'export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }',
    '',
    'export const authRoutes: AuthRoute[] = [',
  ];

  for (const route of routes) {
    const level = route.auth_level ?? 'none';
    // Use RegExp constructor (not regex literal) to avoid forward-slash delimiter issues.
    // Paths from router.yaml already use regex syntax ([^/]+, .*), just add anchors.
    const regexSource = `^${route.path}$`;
    const methodPart = route.method ? `, method: '${route.method}'` : '';
    lines.push(`  { path: new RegExp('${regexSource}')${methodPart}, auth_level: '${level}' },`);
  }

  lines.push('];', '');

  const outputPath = path.join(servicePath, '_auth-routes.generated.ts');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}

/** Generate _auth_routes_generated.py at the service root (next to router.yaml) */
function generateAuthRoutesPy(servicePath: string, routes: Route[]): void {
  const lines: string[] = [
    '# AUTO-GENERATED from router.yaml — DO NOT EDIT',
    '# Run pnpm generate:router to regenerate',
    '',
    'import re',
    'from dataclasses import dataclass',
    'from typing import Literal, Optional',
    '',
    "AuthLevel = Literal['none', 'valid']",
    '',
    '',
    '@dataclass',
    'class AuthRoute:',
    '    path: re.Pattern',
    '    method: Optional[str]',
    '    auth_level: AuthLevel',
    '',
    '',
    'AUTH_ROUTES: list[AuthRoute] = [',
  ];

  for (const route of routes) {
    const level = route.auth_level ?? 'none';
    const escapedPath = route.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const methodStr = route.method ? `'${route.method}'` : 'None';
    lines.push(`    AuthRoute(path=re.compile(r'^${escapedPath}$'), method=${methodStr}, auth_level='${level}'),`);
  }

  lines.push(']', '');

  const outputPath = path.join(servicePath, '_auth_routes_generated.py');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}

export async function generateRouterConfigs(): Promise<void> {
  log('Starting router configuration generation', 'info');
  log('', 'info');

  const services = loadServices();
  const nestServices = services.nest || [];
  const nextServices = services.next || [];
  const fastapiServices = services.fastapi || [];

  let successCount = 0;
  let errorCount = 0;

  // Обрабатываем NestJS сервисы
  for (const service of nestServices) {
    try {
      log(`Processing NestJS service: ${service.name}`, 'info');

      const servicePath = path.join(__dirname, '../../../services', service.name);
      const outputPath = path.join(servicePath, 'router.yaml');

      // Preserve manually-set auth_level values from existing router.yaml
      const existingAuthLevels = loadExistingAuthLevels(outputPath);

      const extracted = await extractNestRoutes(servicePath);

      let routes: Route[] = extracted;

      if (extracted.length === 0 && fs.existsSync(outputPath)) {
        // Dev-server failed to start (e.g. DB unavailable) — keep existing routes
        // to avoid wiping the file when the environment is not fully available.
        const existing = yaml.parse(fs.readFileSync(outputPath, 'utf-8')) as RouterConfig | undefined;
        const kept = existing?.routes ?? [];
        if (kept.length > 0) {
          log(`  Warning: extraction returned 0 routes, keeping existing ${kept.length} route(s)`, 'error');
          routes = kept;
        }
      }

      // Apply preserved auth_levels (or default 'none')
      routes = routes.map((r) => ({
        ...r,
        auth_level: existingAuthLevels.get(`${r.path}:${r.method ?? ''}`) ?? r.auth_level ?? 'none',
      }));

      log(`  Found ${routes.length} route(s)`, 'info');

      const routerConfig: RouterConfig = {
        service: service.name,
        type: 'nest',
        routes: routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)),
      };

      const yamlContent = yaml.stringify(routerConfig, { indent: 2 });

      const fileHeader = `# This file is automatically generated and should not be edited manually!\n# Generated router configuration for ${service.name} service\n# auth_level is manually maintained — use pnpm run generate:router to update routes.\n\n`;

      fs.writeFileSync(outputPath, fileHeader + yamlContent, 'utf-8');

      const relativePath = path.relative(process.cwd(), outputPath);
      log(`Generated: ${relativePath}`, 'success');

      // Generate src/_auth-routes.generated.ts
      generateAuthRoutesTs(servicePath, routerConfig.routes);
      log(`  Generated: src/_auth-routes.generated.ts`, 'success');

      // Обновляем Grafana дашборд для NestJS сервиса
      try {
        log(`  Updating Grafana dashboard...`, 'info');
        updateGrafanaDashboard(service.name);
      } catch (dashboardError) {
        log(
          `  Warning: Failed to update Grafana dashboard: ${dashboardError instanceof Error ? dashboardError.message : dashboardError}`,
          'error',
        );
      }

      successCount++;
    } catch (error) {
      log(`Error processing ${service.name}: ${error instanceof Error ? error.message : error}`, 'error');
      errorCount++;
    }
  }

  // Обрабатываем Next.js сервисы
  for (const service of nextServices) {
    try {
      log(`Processing Next.js service: ${service.name}`, 'info');

      const servicePath = path.join(__dirname, '../../../services', service.name);
      const outputPath = path.join(servicePath, 'router.yaml');

      // Preserve manually-set auth_level values from existing router.yaml
      const existingAuthLevels = loadExistingAuthLevels(outputPath);

      const rawRoutes = extractNextRoutes(servicePath, service.name);
      const routes: Route[] = rawRoutes.map((r) => ({
        ...r,
        auth_level: existingAuthLevels.get(`${r.path}:${r.method ?? ''}`) ?? 'none',
      }));

      log(`  Found ${routes.length} route(s)`, 'info');

      const routerConfig: RouterConfig = {
        service: service.name,
        type: 'next',
        routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      };

      const fileHeader = `# This file is automatically generated and should not be edited manually!\n# Routes are extracted from Next.js app/ directory; auth_level is manually maintained.\n# Use pnpm run generate:router to update this file\n\n`;
      const yamlContent = yaml.stringify(routerConfig, { indent: 2 });

      fs.writeFileSync(outputPath, fileHeader + yamlContent, 'utf-8');

      const relativePath = path.relative(process.cwd(), outputPath);
      log(`Generated: ${relativePath}`, 'success');

      // Generate src/_auth-routes.generated.ts
      generateAuthRoutesTs(servicePath, routerConfig.routes);
      log(`  Generated: src/_auth-routes.generated.ts`, 'success');

      // Обновляем Grafana дашборд для Next.js сервиса
      try {
        log(`  Updating Grafana dashboard...`, 'info');
        updateGrafanaDashboard(service.name);
      } catch (dashboardError) {
        log(
          `  Warning: Failed to update Grafana dashboard: ${dashboardError instanceof Error ? dashboardError.message : dashboardError}`,
          'error',
        );
      }

      successCount++;
    } catch (error) {
      log(`Error processing ${service.name}: ${error instanceof Error ? error.message : error}`, 'error');
      errorCount++;
    }
  }

  // Обрабатываем FastAPI сервисы
  for (const service of fastapiServices) {
    try {
      log(`Processing FastAPI service: ${service.name}`, 'info');

      const servicePath = path.join(__dirname, '../../../services', service.name);
      const outputPath = path.join(servicePath, 'router.yaml');

      // Preserve manually-set auth_level values from existing router.yaml
      const existingAuthLevels = loadExistingAuthLevels(outputPath);

      const extracted = extractFastapiRoutes(servicePath, service.name);
      const routes: Route[] = extracted.map((r: Route) => ({
        ...r,
        auth_level: existingAuthLevels.get(`${r.path}:${r.method ?? ''}`) ?? r.auth_level ?? 'none',
      }));

      log(`  Found ${routes.length} route(s)`, 'info');

      const routerConfig: RouterConfig = {
        service: service.name,
        type: 'fastapi',
        routes: routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)),
      };

      const yamlContent = yaml.stringify(routerConfig, { indent: 2 });
      const fileHeader = `# This file is automatically generated and should not be edited manually!\n# Generated router configuration for ${service.name} service\n# auth_level is manually maintained — use pnpm run generate:router to update routes.\n\n`;

      fs.writeFileSync(outputPath, fileHeader + yamlContent, 'utf-8');

      const relativePath = path.relative(process.cwd(), outputPath);
      log(`Generated: ${relativePath}`, 'success');

      // Generate app/_auth_routes_generated.py
      generateAuthRoutesPy(servicePath, routerConfig.routes);
      log(`  Generated: app/_auth_routes_generated.py`, 'success');

      // Обновляем Grafana дашборд для FastAPI сервиса
      try {
        log(`  Updating Grafana dashboard...`, 'info');
        updateGrafanaDashboard(service.name);
      } catch (dashboardError) {
        log(
          `  Warning: Failed to update Grafana dashboard: ${dashboardError instanceof Error ? dashboardError.message : dashboardError}`,
          'error',
        );
      }

      successCount++;
    } catch (error) {
      log(`Error processing ${service.name}: ${error instanceof Error ? error.message : error}`, 'error');
      errorCount++;
    }
  }

  log('', 'info');
  log('Router generation summary:', 'info');
  log(`  Total files generated: ${successCount}`, 'success');
  if (errorCount > 0) {
    log(`  Errors encountered: ${errorCount}`, 'error');
  }
}

// Запускаем генерацию, если файл запущен напрямую
if (require.main === module) {
  generateRouterConfigs().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
