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

    // Если роуты не найдены, выведем последние 20 строк лога для отладки
    if (routes.length === 0) {
      console.log('⚠️  No routes found. Last 20 lines of output:');
      const lastLines = logLines.slice(-20);
      for (const line of lastLines) {
        console.log(`   ${line}`);
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
    const child = spawn('pnpm', ['run', 'dev'], {
      cwd: servicePath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Добавляем минимальные переменные окружения для запуска
        NODE_ENV: 'development',
        PORT: '0', // Используем порт 0, чтобы избежать конфликтов
        // Добавляем фиктивные переменные для базы данных, чтобы приложение могло запуститься
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'dummy_db',
        DB_USER: 'dummy_user',
        DB_PASSWORD: 'dummy_password',
        // JWT секрет для auth модулей
        JWT_SECRET: 'dummy_secret_for_route_extraction',
        // Отключаем автоматическое подключение к БД
        SKIP_DB_CONNECTION: 'true',
      },
    });

    let output = '';
    let foundRoutes = false;
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1000);

      if (foundRoutes) {
        resolve(output);
      } else {
        reject(new Error('Timeout: no routes found'));
      }
    }, 30000); // Увеличиваем таймаут до 30 секунд

    const handleData = (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;

      // Проверяем наличие RouterExplorer в разных форматах
      if (chunk.includes('RouterExplorer') || chunk.includes('Mapped {')) {
        foundRoutes = true;
      }

      // Проверяем успешный старт приложения
      const hasStarted =
        chunk.includes('Nest application successfully started') ||
        chunk.includes('Application is running on') ||
        chunk.includes('successfully started');

      // Проверяем критические ошибки, которые означают, что приложение не запустится
      const hasCriticalError =
        chunk.includes('Error: ') &&
        (chunk.includes('ECONNREFUSED') || chunk.includes('Cannot find module') || chunk.includes('SyntaxError'));

      // Если критическая ошибка, но мы уже нашли роуты - завершаем успешно
      if (hasCriticalError && foundRoutes) {
        clearTimeout(timeout);
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 500);
        resolve(output);
        return;
      }

      // Если нашли роуты и приложение запустилось, завершаем
      if (hasStarted && foundRoutes) {
        clearTimeout(timeout);
        setTimeout(() => {
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 500);
          resolve(output);
        }, 500);
      }

      // Если приложение запустилось, но роутов не найдено, даем еще немного времени
      if (hasStarted && !foundRoutes) {
        setTimeout(() => {
          clearTimeout(timeout);
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 500);
          resolve(output);
        }, 2000);
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
      if (code !== 0 && code !== null && !foundRoutes) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve(output);
      }
    });
  });
}

function parseRouteFromLog(logLine: string): Route | null {
  // Пробуем разные паттерны для парсинга роутов
  const patterns = [
    // Стандартный формат: [RouterExplorer] Mapped {/path, GET} route
    /\[RouterExplorer\]\s+Mapped\s+\{([^,]+),\s+([^}]+)\}\s+route/,
    // Альтернативный формат: [RouterExplorer] Mapped {/path, GET}
    /\[RouterExplorer\]\s+Mapped\s+\{([^,]+),\s+([^}]+)\}/,
    // Формат с контекстом: [Nest] ... [RouterExplorer] Mapped {/path, GET}
    /RouterExplorer\]\s+Mapped\s+\{([^,]+),\s+([^}]+)\}/,
  ];

  for (const pattern of patterns) {
    const match = logLine.match(pattern);
    if (match) {
      const [, routePath, method] = match;
      const cleanPath = routePath.trim();
      const cleanMethod = method.trim();

      const pathWithRegex = convertPathToRegex(cleanPath);

      return {
        path: pathWithRegex,
        method: cleanMethod,
      };
    }
  }

  return null;
}

function convertPathToRegex(routePath: string): string {
  return routePath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '[^/]+');
}
