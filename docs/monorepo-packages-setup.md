# Настройка импортов из монорепозитория

Этот документ описывает, как настроены импорты из общих пакетов (`packages/`) в сервисах.

## Структура

```
supreme-infra/
├── packages/
│   ├── instrumentation/
│   │   └── src/
│   └── nestjs-shared/
│       └── src/
└── services/
    ├── backend/
    └── frontend/
```

## Импорты

Все пакеты импортируются через алиас `@supreme-int/*`:

```typescript
import { createOpenTelemetrySDK } from '@supreme-int/instrumentation';
import { LoggerModule } from '@supreme-int/nestjs-shared';
```

## Backend (NestJS + Webpack)

### webpack.config.js

Backend использует **динамическое создание алиасов** - автоматически сканирует папку `packages/` и создаёт алиасы для всех пакетов с папкой `src/`:

```javascript
const fs = require('node:fs');
const path = require('node:path');

const packagesDir = path.resolve(__dirname, '../../packages');

// Динамически создаём алиасы для всех пакетов
const packageAliases = {};
if (fs.existsSync(packagesDir)) {
  const packages = fs.readdirSync(packagesDir);
  for (const pkg of packages) {
    const srcPath = path.join(packagesDir, pkg, 'src');
    if (fs.existsSync(srcPath)) {
      packageAliases[`@supreme-int/${pkg}`] = srcPath;
    }
  }
}

// В webpack конфиге:
resolve: {
  alias: {
    ...packageAliases,
  },
}
```

**Преимущества:**
- ✅ Автоматически подхватывает новые пакеты
- ✅ Не требует обновления конфига при добавлении пакетов
- ✅ Работает с `webpack-node-externals` для правильного бандлинга

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": "../..",
    "paths": {
      "@supreme-int/*": ["packages/*/src"]
    }
  }
}
```

## Frontend (Next.js + Turbopack)

### next.config.ts

Frontend использует **wildcard паттерн** для Turbopack:

```typescript
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@supreme-int/*': '../../packages/*/src',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supreme-int': path.resolve(__dirname, '../../packages'),
      };
    }
    return config;
  },
};
```

**Особенности:**
- Turbopack поддерживает wildcard паттерны (`*`)
- Для Webpack (fallback) используется базовый алиас на папку `packages/`
- Относительные пути для Turbopack (не абсолютные!)

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@supreme-int/*": ["../../packages/*/src"]
    }
  }
}
```

## Добавление нового пакета

1. Создайте папку в `packages/`:
   ```bash
   mkdir -p packages/my-new-package/src
   ```

2. Создайте `package.json`:
   ```json
   {
     "name": "@supreme-int/my-new-package",
     "version": "1.0.0"
   }
   ```

3. Создайте `src/index.ts` с экспортами

4. **Всё!** Алиасы подхватятся автоматически:
   - Backend: динамически создаст алиас при следующей сборке
   - Frontend: wildcard паттерн уже покрывает новый пакет

5. Добавьте зависимость в сервис:
   ```json
   {
     "dependencies": {
       "@supreme-int/my-new-package": "workspace:*"
     }
   }
   ```

## Проверка

Убедитесь, что импорты работают:

```typescript
// В любом сервисе
import { something } from '@supreme-int/my-new-package';
```

Если TypeScript ругается, перезапустите TypeScript сервер в IDE.

## Troubleshooting

### Backend не видит пакет

1. Проверьте, что есть папка `src/` внутри пакета
2. Перезапустите dev сервер
3. Удалите `dist/` и пересоберите

### Frontend не видит пакет

1. Проверьте, что путь в `turbopack.resolveAlias` относительный
2. Для Turbopack используйте wildcard: `@supreme-int/*`
3. Перезапустите Next.js dev сервер

### TypeScript не находит типы

1. Проверьте `paths` в `tsconfig.json`
2. Перезапустите TypeScript сервер: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. Убедитесь, что `baseUrl` настроен правильно

