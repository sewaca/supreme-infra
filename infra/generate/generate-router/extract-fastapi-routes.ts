import * as fs from 'node:fs';
import * as path from 'node:path';

interface Route {
  path: string;
  method: string;
}

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

// Matches @router.get("/path") or @app.post("/path") or @router.get('/path', ...)
const ROUTE_DECORATOR_REGEX = /^\s*@\w+\.(\w+)\s*\(\s*["']([^"']+)["']/;

function convertFastapiPathToRegex(routePath: string): string {
  // FastAPI uses {param} for path parameters
  return routePath.replace(/\{[^}]+\}/g, '[^/]+');
}

function scanPythonFile(filePath: string, prefix: string): Route[] {
  const routes: Route[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const match = ROUTE_DECORATOR_REGEX.exec(line);
    if (!match) continue;

    const method = match[1].toLowerCase();
    const routePath = match[2];

    if (!HTTP_METHODS.includes(method)) continue;

    // Skip the status health check endpoint
    if (routePath === '/status' || routePath.endsWith('/api/status')) continue;

    const fullPath = prefix ? `${prefix}${routePath}` : routePath;
    const normalizedPath = convertFastapiPathToRegex(fullPath);

    routes.push({
      path: normalizedPath,
      method: method.toUpperCase(),
    });
  }

  return routes;
}

function scanDirectory(dirPath: string, prefix: string): Route[] {
  const routes: Route[] = [];

  if (!fs.existsSync(dirPath)) {
    return routes;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const subRoutes = scanDirectory(entryPath, prefix);
      routes.push(...subRoutes);
    } else if (entry.isFile() && entry.name.endsWith('.py')) {
      const fileRoutes = scanPythonFile(entryPath, prefix);
      routes.push(...fileRoutes);
    }
  }

  return routes;
}

export function extractFastapiRoutes(servicePath: string, serviceName: string): Route[] {
  const appDir = path.join(servicePath, 'app');
  const apiPrefix = `/${serviceName}`;

  const routes = scanDirectory(appDir, apiPrefix);

  // Add static assets route
  routes.push({
    path: `/${serviceName}/.*`,
    method: 'GET',
  });

  return routes;
}
