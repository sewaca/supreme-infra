import { spawn } from 'node:child_process';

interface Route {
  path: string;
  method: string;
}

export async function extractNestRoutes(servicePath: string): Promise<Route[]> {
  const routes: Route[] = [];
  
  try {
    const output = await runDevServerAndCaptureOutput(servicePath);
    const cleanOutput = stripAnsiCodes(output);
    const logLines = cleanOutput.split('\n');
    
    for (const line of logLines) {
      const route = parseRouteFromLog(line);
      if (route) {
        routes.push(route);
      }
    }
  } catch (error) {
    console.error(`Failed to extract routes from ${servicePath}:`, error);
  }
  
  return routes;
}

function stripAnsiCodes(text: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Need to strip ANSI escape codes
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function runDevServerAndCaptureOutput(servicePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = spawn('pnpm', ['run', 'print-routes'], {
      cwd: servicePath,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1000);
      reject(new Error('Timeout: route extraction took too long'));
    }, 15000);

    const handleData = (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      
      if (chunk.includes('___ROUTES_EXTRACTION_COMPLETE___')) {
        clearTimeout(timeout);
        child.kill('SIGTERM');
        resolve(output);
      }
    };

    child.stdout?.on('data', handleData);
    child.stderr?.on('data', handleData);

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code === 0 && output.includes('___ROUTES_EXTRACTION_COMPLETE___')) {
        resolve(output);
      }
    });
  });
}

function parseRouteFromLog(logLine: string): Route | null {
  const routePattern = /\[RouterExplorer\]\s+Mapped\s+\{([^,]+),\s+([^}]+)\}\s+route/;
  const match = logLine.match(routePattern);
  
  if (!match) {
    return null;
  }
  
  const [, routePath, method] = match;
  const cleanPath = routePath.trim();
  const cleanMethod = method.trim();
  
  const pathWithRegex = convertPathToRegex(cleanPath);
  
  return {
    path: pathWithRegex,
    method: cleanMethod,
  };
}

function convertPathToRegex(routePath: string): string {
  return routePath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '[^/]+');
}
