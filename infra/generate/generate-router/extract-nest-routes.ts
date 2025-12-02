import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

interface Route {
  path: string;
  method: string;
}

// TODO: переписать на человеческий формат

const HTTP_METHODS = [
  'Get',
  'Post',
  'Put',
  'Delete',
  'Patch',
  'Options',
  'Head',
] as const;

export function extractNestRoutes(servicePath: string): Route[] {
  const routes: Route[] = [];
  const srcPath = path.join(servicePath, 'src');

  if (!fs.existsSync(srcPath)) {
    return routes;
  }

  const tsFiles = findTsFiles(srcPath);

  for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        const controllerPath = extractControllerPath(node);
        const methodRoutes = extractMethodRoutes(node, controllerPath);
        routes.push(...methodRoutes);
      }
    });
  }

  return routes;
}

function findTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && entry.name !== 'node_modules') {
      files.push(...findTsFiles(fullPath));
    } else if (isValidTsFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isValidTsFile(fileName: string): boolean {
  return (
    fileName.endsWith('.ts') &&
    !fileName.endsWith('.spec.ts') &&
    !fileName.endsWith('.test.ts') &&
    !fileName.endsWith('.d.ts')
  );
}

function extractControllerPath(node: ts.ClassDeclaration): string {
  const decorators = ts.canHaveDecorators(node)
    ? ts.getDecorators(node)
    : undefined;

  if (!decorators) {
    return '';
  }

  for (const decorator of decorators) {
    const controllerPath = tryExtractControllerPath(decorator);
    if (controllerPath !== null) {
      return controllerPath;
    }
  }

  return '';
}

function tryExtractControllerPath(decorator: ts.Decorator): string | null {
  if (!ts.isCallExpression(decorator.expression)) {
    return null;
  }

  const expression = decorator.expression;

  if (
    !ts.isIdentifier(expression.expression) ||
    expression.expression.text !== 'Controller'
  ) {
    return null;
  }

  if (expression.arguments.length === 0) {
    return '';
  }

  const arg = expression.arguments[0];
  return ts.isStringLiteral(arg) ? arg.text : '';
}

function extractMethodRoutes(
  node: ts.ClassDeclaration,
  controllerPath: string,
): Route[] {
  const routes: Route[] = [];

  if (!node.members) {
    return routes;
  }

  for (const member of node.members) {
    if (ts.isMethodDeclaration(member)) {
      const methodRoutes = extractRoutesFromMethod(member, controllerPath);
      routes.push(...methodRoutes);
    }
  }

  return routes;
}

function extractRoutesFromMethod(
  method: ts.MethodDeclaration,
  controllerPath: string,
): Route[] {
  const routes: Route[] = [];
  const decorators = ts.canHaveDecorators(method)
    ? ts.getDecorators(method)
    : undefined;

  if (!decorators) {
    return routes;
  }

  for (const decorator of decorators) {
    const route = tryExtractRoute(decorator, controllerPath);
    if (route) {
      routes.push(route);
    }
  }

  return routes;
}

function tryExtractRoute(
  decorator: ts.Decorator,
  controllerPath: string,
): Route | null {
  if (!ts.isCallExpression(decorator.expression)) {
    return null;
  }

  const expression = decorator.expression;

  if (!ts.isIdentifier(expression.expression)) {
    return null;
  }

  const methodName = expression.expression.text;

  if (!HTTP_METHODS.includes(methodName as (typeof HTTP_METHODS)[number])) {
    return null;
  }

  const routePath = extractRoutePath(expression);
  const fullPath = buildFullPath(controllerPath, routePath);

  return {
    path: fullPath,
    method: methodName.toUpperCase(),
  };
}

function extractRoutePath(expression: ts.CallExpression): string {
  if (expression.arguments.length === 0) {
    return '';
  }

  const arg = expression.arguments[0];
  return ts.isStringLiteral(arg) ? arg.text : '';
}

function buildFullPath(controllerPath: string, routePath: string): string {
  const parts = [controllerPath, routePath].filter(Boolean);
  let fullPath = parts.length > 0 ? `/${parts.join('/')}` : '/';

  // Убираем двойные слеши
  fullPath = fullPath.replace(/\/+/g, '/');

  // Конвертируем :param в regex для ingress-nginx
  fullPath = fullPath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '[^/]+');

  return fullPath;
}
