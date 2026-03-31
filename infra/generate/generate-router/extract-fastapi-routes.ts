import * as fs from 'node:fs';
import * as path from 'node:path';

interface Route {
  path: string;
  method: string;
}

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

// Matches @router.get("/path") or @app.post("/path") or @router.get('') - use * to capture empty paths
const ROUTE_DECORATOR_REGEX = /^\s*@\w+\.(\w+)\s*\(\s*["']([^"']*)["']/;
// WebSocket: в Ingress нужен GET (handshake Upgrade); в router.yaml — тот же путь
const WEBSOCKET_DECORATOR_REGEX = /^\s*@\w+\.websocket\s*\(\s*["']([^"']*)["']/;

// Matches APIRouter(prefix="/xxx") or APIRouter(prefix='/xxx')
const APIROUTER_PREFIX_REGEX = /APIRouter\s*\(\s*[^)]*prefix\s*=\s*["']([^"']*)["']/;

// Matches app.include_router(module.router) or app.include_router(module.router, prefix="/xxx")
const INCLUDE_ROUTER_REGEX = /include_router\s*\(\s*(\w+)\.router\s*(?:,\s*[^)]*prefix\s*=\s*["']([^"']*)["'])?\s*\)/;

// Matches: from app.routers import a, b, c as d (single line or multiline with parentheses)
const ROUTER_IMPORT_REGEX = /from\s+app\.routers\s+import\s+(?:\(([^)]+)\)|([\w\s,]+))/s;

function convertFastapiPathToRegex(routePath: string): string {
  // FastAPI uses {param} for path parameters
  return routePath.replace(/\{[^}]+\}/g, '[^/]+');
}

function extractRouterPrefix(routerFilePath: string): string {
  if (!fs.existsSync(routerFilePath)) return '';
  const content = fs.readFileSync(routerFilePath, 'utf-8');
  const match = APIROUTER_PREFIX_REGEX.exec(content);
  return match ? match[1] : '';
}

function parseRouterImports(mainContent: string): Map<string, string> {
  // Maps local import name -> module file name (e.g. settings_router -> settings)
  const aliasToModule = new Map<string, string>();
  const match = ROUTER_IMPORT_REGEX.exec(mainContent);
  if (!match) return aliasToModule;

  // match[1] is for parenthesized imports, match[2] is for single-line imports
  const importList = match[1] || match[2];
  if (!importList) return aliasToModule;

  // Parse "dormitory, orders, profile, rating, references, settings as settings_router, status, subjects"
  const items = importList
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const item of items) {
    if (item.includes(' as ')) {
      const [moduleName, alias] = item.split(/\s+as\s+/).map((s) => s.trim());
      aliasToModule.set(alias, moduleName);
    } else {
      aliasToModule.set(item, item);
    }
  }
  return aliasToModule;
}

function parseIncludeRouterCalls(mainContent: string): Array<{ moduleRef: string; includePrefix: string }> {
  const result: Array<{ moduleRef: string; includePrefix: string }> = [];
  const regex = new RegExp(INCLUDE_ROUTER_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: TODO: FIXME: idk
  while ((match = regex.exec(mainContent)) !== null) {
    const moduleRef = match[1]; // e.g. references, settings_router
    const includePrefix = match[2] || ''; // from include_router(..., prefix="/api")
    result.push({ moduleRef, includePrefix });
  }
  return result;
}

function hasStaticFilesMount(mainContent: string): boolean {
  return /StaticFiles|\.mount\s*\(/s.test(mainContent);
}

function scanPythonFileForRoutes(filePath: string, prefix: string): Route[] {
  const routes: Route[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const wsMatch = WEBSOCKET_DECORATOR_REGEX.exec(line);
    if (wsMatch) {
      const routePath = wsMatch[1];
      if (routePath === '/status' || routePath.endsWith('/api/status')) continue;
      const fullPath = prefix ? `${prefix}${routePath}` : routePath;
      const normalizedPath = convertFastapiPathToRegex(fullPath);
      routes.push({
        path: normalizedPath,
        method: 'GET',
      });
      continue;
    }

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

export function extractFastapiRoutes(servicePath: string, serviceName: string): Route[] {
  const appDir = path.join(servicePath, 'app');
  const mainPath = path.join(appDir, 'main.py');
  const routersDir = path.join(appDir, 'routers');
  const apiPrefix = `/${serviceName}`;

  const seen = new Set<string>();
  const routes: Route[] = [];

  function addRoute(route: Route): void {
    const key = `${route.path}|${route.method}`;
    if (seen.has(key)) return;
    seen.add(key);
    routes.push(route);
  }

  if (!fs.existsSync(mainPath)) {
    // Fallback: scan entire app directory with service prefix only (no main.py)
    if (fs.existsSync(appDir)) {
      for (const entry of fs.readdirSync(appDir, { withFileTypes: true })) {
        const entryPath = path.join(appDir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.py') && entry.name !== 'main.py') {
          for (const r of scanPythonFileForRoutes(entryPath, apiPrefix)) {
            addRoute(r);
          }
        }
      }
      if (fs.existsSync(routersDir)) {
        for (const entry of fs.readdirSync(routersDir, { withFileTypes: true })) {
          if (entry.isFile() && entry.name.endsWith('.py')) {
            const entryPath = path.join(routersDir, entry.name);
            for (const r of scanPythonFileForRoutes(entryPath, apiPrefix)) {
              addRoute(r);
            }
          }
        }
      }
    }
    return routes;
  }

  const mainContent = fs.readFileSync(mainPath, 'utf-8');
  const aliasToModule = parseRouterImports(mainContent);
  const includeCalls = parseIncludeRouterCalls(mainContent);

  for (const { moduleRef, includePrefix } of includeCalls) {
    const moduleName = aliasToModule.get(moduleRef) ?? moduleRef;
    const routerFilePath = path.join(routersDir, `${moduleName}.py`);

    if (!fs.existsSync(routerFilePath)) continue;

    const routerPrefix = extractRouterPrefix(routerFilePath);
    const combinedPrefix = includePrefix + routerPrefix;
    const fullPrefix = apiPrefix + combinedPrefix;

    const fileRoutes = scanPythonFileForRoutes(routerFilePath, fullPrefix);
    for (const r of fileRoutes) {
      addRoute(r);
    }
  }

  // Add static assets wildcard only when main.py mounts StaticFiles
  if (hasStaticFilesMount(mainContent)) {
    addRoute({ path: `/${serviceName}/.*`, method: 'GET' });
  }

  return routes;
}
