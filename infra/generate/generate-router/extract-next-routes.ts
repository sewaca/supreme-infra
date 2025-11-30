import * as fs from 'node:fs';
import * as path from 'node:path';

interface Route {
  path: string;
  method: string;
}

export function extractNextRoutes(servicePath: string): Route[] {
  const routes: Route[] = [];
  const appPath = path.join(servicePath, 'app');

  if (!fs.existsSync(appPath)) {
    return routes;
  }

  // Рекурсивно обходим app directory
  const scanDirectory = (dir: string, basePath: string = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Обрабатываем динамические роуты [param]
        const isDynamic =
          entry.name.startsWith('[') && entry.name.endsWith(']');
        // Для ingress-nginx используем regex вместо :param
        const newPath = isDynamic
          ? `${basePath}/[^/]+`
          : `${basePath}/${entry.name}`;

        scanDirectory(fullPath, newPath);
      } else if (entry.isFile()) {
        // Обрабатываем page.tsx и route.ts
        if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
          // Next.js pages поддерживают GET по умолчанию
          routes.push({
            path: basePath || '/',
            method: 'GET',
          });
        } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
          // API routes - проверяем экспортируемые функции
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Ищем экспортируемые HTTP методы
          const httpMethods = [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH',
            'HEAD',
            'OPTIONS',
          ];
          for (const method of httpMethods) {
            // Простая проверка на наличие экспорта функции
            const exportRegex = new RegExp(
              `export\\s+(async\\s+)?function\\s+${method}\\s*\\(`,
              'g',
            );
            if (exportRegex.test(content)) {
              routes.push({
                path: basePath || '/',
                method,
              });
            }
          }
        }
      }
    }
  };

  scanDirectory(appPath);

  return routes;
}
