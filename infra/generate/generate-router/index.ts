import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { loadServices } from '../shared/load-services';
import { extractNestRoutes } from './extract-nest-routes';
import { extractNextRoutes } from './extract-next-routes';

interface Route {
  path: string;
  method: string;
}

interface RouterConfig {
  service: string;
  type: 'nest' | 'next';
  routes: Route[];
}

function log(
  message: string,
  level: 'info' | 'success' | 'error' = 'info',
): void {
  const prefix = {
    info: '→',
    success: '✓',
    error: '✗',
  };
  console.log(`${prefix[level]} ${message}`);
}

export async function generateRouterConfigs(): Promise<void> {
  log('Starting router configuration generation', 'info');
  log('', 'info');

  const services = loadServices();
  const nestServices = services.nest || [];
  const nextServices = services.next || [];

  let successCount = 0;
  let errorCount = 0;

  // Обрабатываем NestJS сервисы
  for (const service of nestServices) {
    try {
      log(`Processing NestJS service: ${service.name}`, 'info');

      const servicePath = path.join(
        __dirname,
        '../../../services',
        service.name,
      );
      const routes = await extractNestRoutes(servicePath);

      log(`  Found ${routes.length} route(s)`, 'info');

      const routerConfig: RouterConfig = {
        service: service.name,
        type: 'nest',
        routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      };

      const outputPath = path.join(servicePath, 'router.yaml');
      const yamlContent = yaml.stringify(routerConfig, { indent: 2 });

      fs.writeFileSync(outputPath, yamlContent, 'utf-8');

      const relativePath = path.relative(process.cwd(), outputPath);
      log(`Generated: ${relativePath}`, 'success');
      successCount++;
    } catch (error) {
      log(
        `Error processing ${service.name}: ${error instanceof Error ? error.message : error}`,
        'error',
      );
      errorCount++;
    }
  }

  // Обрабатываем Next.js сервисы
  for (const service of nextServices) {
    try {
      log(`Processing Next.js service: ${service.name}`, 'info');

      const servicePath = path.join(
        __dirname,
        '../../../services',
        service.name,
      );
      const routes = extractNextRoutes(servicePath);

      log(`  Found ${routes.length} route(s)`, 'info');

      const routerConfig: RouterConfig = {
        service: service.name,
        type: 'next',
        routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      };

      const outputPath = path.join(servicePath, 'router.yaml');
      const yamlContent = yaml.stringify(routerConfig, { indent: 2 });

      fs.writeFileSync(outputPath, yamlContent, 'utf-8');

      const relativePath = path.relative(process.cwd(), outputPath);
      log(`Generated: ${relativePath}`, 'success');
      successCount++;
    } catch (error) {
      log(
        `Error processing ${service.name}: ${error instanceof Error ? error.message : error}`,
        'error',
      );
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
