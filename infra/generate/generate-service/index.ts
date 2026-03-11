import * as fs from 'node:fs';
import * as path from 'node:path';
import { input, number, select } from '@inquirer/prompts';
import Handlebars from 'handlebars';
import * as yaml from 'yaml';

interface ServiceConfig {
  serviceName: string;
  serviceType: 'nest' | 'next' | 'fastapi';
  description: string;
  port: number;
  apiPrefix?: string;
  hasDatabase: boolean;
  databaseName?: string;
  databaseUser?: string;
  databasePasswordSecret?: string;
}

interface ServicesYaml {
  services: {
    nest: Array<{
      name: string;
      description: string;
      database?: {
        enabled: boolean;
      };
    }>;
    next: Array<{
      name: string;
      description: string;
    }>;
    fastapi: Array<{
      name: string;
      description: string;
      database?: {
        enabled: boolean;
      };
    }>;
  };
}

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const COMMON_TEMPLATES_DIR = path.join(__dirname, 'templates/common');
const SERVICES_DIR = path.join(__dirname, '../../../services');
const SERVICES_YAML_PATH = path.join(__dirname, '../../../services.yaml');

async function promptServiceConfig(): Promise<ServiceConfig> {
  const serviceName = await input({
    message: 'Название сервиса (например: auth-bff, user-service):',
    validate: (value: string) => {
      if (!value) return 'Название сервиса обязательно';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Используйте только строчные буквы, цифры и дефисы';
      const servicePath = path.join(SERVICES_DIR, value);
      if (fs.existsSync(servicePath)) return `Сервис ${value} уже существует`;
      return true;
    },
  });

  const serviceType = await select({
    message: 'Тип сервиса:',
    choices: [
      { name: 'NestJS (Backend)', value: 'nest' },
      { name: 'Next.js (Frontend)', value: 'next' },
      { name: 'FastAPI (Python Backend)', value: 'fastapi' },
    ],
  });

  const description = await input({
    message: 'Описание сервиса:',
    validate: (value: string) => (value ? true : 'Описание обязательно'),
  });

  const defaultPort = serviceType === 'nest' ? 4000 : serviceType === 'fastapi' ? 8000 : 3000;
  const port = await number({
    message: 'Порт для локальной разработки:',
    default: defaultPort,
    validate: (value: number | undefined) => {
      if (!value || value < 1024 || value > 65535) return 'Порт должен быть от 1024 до 65535';
      return true;
    },
  });

  let apiPrefix: string | undefined;
  let hasDatabase = false;
  let databaseName: string | undefined;
  let databaseUser: string | undefined;
  let databasePasswordSecret: string | undefined;

  if (serviceType === 'nest' || serviceType === 'fastapi') {
    const typeLabel = serviceType === 'nest' ? 'NestJS' : 'FastAPI';
    apiPrefix = await input({
      message: `API префикс (для ${typeLabel}):`,
      default: serviceName,
    });

    hasDatabase = await select({
      message: 'Нужна ли сервису база данных PostgreSQL?',
      choices: [
        { name: 'Нет', value: false },
        { name: 'Да', value: true },
      ],
      default: false,
    });

    if (hasDatabase) {
      databaseName = await input({
        message: 'Название базы данных:',
        default: `${serviceName.replace(/-/g, '_')}_db`,
        validate: (value: string) => {
          if (!value) return 'Название базы данных обязательно';
          if (!/^[a-z0-9_]+$/.test(value)) return 'Используйте только строчные буквы, цифры и подчеркивания';
          return true;
        },
      });

      databaseUser = await input({
        message: 'Имя пользователя базы данных:',
        default: `${serviceName.replace(/-/g, '_')}_user`,
        validate: (value: string) => {
          if (!value) return 'Имя пользователя обязательно';
          if (!/^[a-z0-9_]+$/.test(value)) return 'Используйте только строчные буквы, цифры и подчеркивания';
          return true;
        },
      });

      databasePasswordSecret = await input({
        message: 'Название GitHub Secret для пароля БД:',
        default: `DB_PASSWORD`,
        validate: (value: string) => {
          if (!value) return 'Название секрета обязательно';
          if (!/^[A-Z0-9_]+$/.test(value)) return 'Используйте только заглавные буквы, цифры и подчеркивания';
          return true;
        },
      });
    }
  }

  return {
    serviceName,
    serviceType: serviceType as 'nest' | 'next' | 'fastapi',
    description,
    port: port as number,
    apiPrefix,
    hasDatabase,
    databaseName,
    databaseUser,
    databasePasswordSecret,
  };
}

function copyTemplateFile(templatePath: string, targetPath: string, config: ServiceConfig, isHandlebars = true): void {
  const content = fs.readFileSync(templatePath, 'utf-8');

  if (isHandlebars) {
    const template = Handlebars.compile(content);
    const rendered = template(config);
    fs.writeFileSync(targetPath, rendered);
  } else {
    fs.writeFileSync(targetPath, content);
  }
}

function generateGrafanaDashboard(config: ServiceConfig): void {
  const templatePath = path.join(COMMON_TEMPLATES_DIR, config.serviceType, 'grafana-dashboard.json.hbs');
  const dashboardsDir = path.join(__dirname, '../../helmcharts/grafana/dashboards');

  if (!fs.existsSync(dashboardsDir)) {
    fs.mkdirSync(dashboardsDir, { recursive: true });
  }

  const targetPath = path.join(dashboardsDir, `${config.serviceName}-metrics.json`);

  // For Grafana dashboards, we use simple string replacement instead of Handlebars
  // to avoid conflicts with Grafana's own {{ }} template syntax
  const content = fs.readFileSync(templatePath, 'utf-8');
  const rendered = content.replace(/\{\{serviceName\}\}/g, config.serviceName);
  fs.writeFileSync(targetPath, rendered);
}

function generateDatabaseInitScript(config: ServiceConfig): void {
  if (!config.hasDatabase || (config.serviceType !== 'nest' && config.serviceType !== 'fastapi')) {
    return;
  }

  const dbDir = path.join(__dirname, '../../databases', `${config.serviceName}-db`);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Generate init.sql
  const initSqlTemplatePath = path.join(COMMON_TEMPLATES_DIR, config.serviceType, 'database-init.sql.hbs');
  const initSqlTargetPath = path.join(dbDir, 'init.sql');
  copyTemplateFile(initSqlTemplatePath, initSqlTargetPath, config, true);
}

function generateDatabaseServiceYaml(config: ServiceConfig): void {
  if (!config.hasDatabase || (config.serviceType !== 'nest' && config.serviceType !== 'fastapi')) {
    return;
  }

  const dbDir = path.join(__dirname, '../../databases', `${config.serviceName}-db`);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Generate service.yaml for database
  const dbServiceConfig = {
    database: {
      name: config.databaseName,
      user: config.databaseUser,
      passwordSecret: config.databasePasswordSecret,
    },
    resources: {
      production: {
        limits: {
          cpu: '500m',
          memory: '500Mi',
        },
        requests: {
          cpu: '100m',
          memory: '150Mi',
        },
      },
      development: {
        limits: {
          cpu: '250m',
          memory: '256Mi',
        },
        requests: {
          cpu: '50m',
          memory: '128Mi',
        },
      },
    },
  };

  const header = [
    `# Database configuration for ${config.serviceName} service`,
    '# This file defines database-specific settings including resources',
    '',
  ].join('\n');

  const yamlContent = header + yaml.stringify(dbServiceConfig);
  const serviceYamlPath = path.join(dbDir, 'service.yaml');
  fs.writeFileSync(serviceYamlPath, yamlContent);
}

const FASTAPI_DATABASE_ONLY_ITEMS = new Set(['alembic', 'alembic.ini']);

function shouldSkipItem(item: string, config: ServiceConfig): boolean {
  if (config.serviceType === 'fastapi' && !config.hasDatabase) {
    const baseName = item.endsWith('.hbs') ? item.slice(0, -4) : item;
    return FASTAPI_DATABASE_ONLY_ITEMS.has(baseName);
  }
  return false;
}

function copyTemplateDirectory(templateDir: string, targetDir: string, config: ServiceConfig): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const items = fs.readdirSync(templateDir);

  for (const item of items) {
    if (shouldSkipItem(item, config)) continue;

    const templatePath = path.join(templateDir, item);
    const stat = fs.statSync(templatePath);

    if (stat.isDirectory()) {
      const newTargetDir = path.join(targetDir, item);
      copyTemplateDirectory(templatePath, newTargetDir, config);
    } else if (stat.isFile()) {
      // Remove .hbs extension from target filename
      const targetFileName = item.endsWith('.hbs') ? item.slice(0, -4) : item;
      const targetPath = path.join(targetDir, targetFileName);
      const isHandlebars = item.endsWith('.hbs');
      copyTemplateFile(templatePath, targetPath, config, isHandlebars);
    }
  }
}

function updateServicesYaml(config: ServiceConfig): void {
  let servicesConfig: ServicesYaml;

  if (fs.existsSync(SERVICES_YAML_PATH)) {
    const content = fs.readFileSync(SERVICES_YAML_PATH, 'utf-8');
    servicesConfig = yaml.parse(content) as ServicesYaml;
  } else {
    servicesConfig = { services: { nest: [], next: [], fastapi: [] } };
  }

  if (!servicesConfig.services.fastapi) {
    servicesConfig.services.fastapi = [];
  }

  if (config.serviceType === 'nest') {
    const serviceEntry: ServicesYaml['services']['nest'][0] = {
      name: config.serviceName,
      description: config.description,
    };

    // If database is enabled, only add minimal config
    // Full database config is now in infra/databases/{service}-db/service.yaml
    if (config.hasDatabase) {
      serviceEntry.database = {
        enabled: true,
      };
    }

    servicesConfig.services.nest.push(serviceEntry);
  } else if (config.serviceType === 'fastapi') {
    const serviceEntry: ServicesYaml['services']['fastapi'][0] = {
      name: config.serviceName,
      description: config.description,
    };

    if (config.hasDatabase) {
      serviceEntry.database = {
        enabled: true,
      };
    }

    servicesConfig.services.fastapi.push(serviceEntry);
  } else {
    servicesConfig.services.next.push({
      name: config.serviceName,
      description: config.description,
    });
  }

  const yamlContent = yaml.stringify(servicesConfig);
  fs.writeFileSync(SERVICES_YAML_PATH, yamlContent);
}

function updateOpenapiTsConfig(config: ServiceConfig): void {
  if (config.serviceType !== 'fastapi') {
    return;
  }

  const apiClientDir = path.join(__dirname, '../../../packages/api-client');
  const openapiConfigPath = path.join(apiClientDir, 'openapi-ts.config.ts');

  if (!fs.existsSync(openapiConfigPath)) {
    console.log('⚠ openapi-ts.config.ts not found, skipping update');
    return;
  }

  const content = fs.readFileSync(openapiConfigPath, 'utf-8');

  // Parse the existing config to extract input and output arrays
  const inputMatch = content.match(/input:\s*\[(.*?)\]/s);
  const outputMatch = content.match(/output:\s*\[(.*?)\]/s);

  if (!inputMatch || !outputMatch) {
    console.log('⚠ Could not parse openapi-ts.config.ts, skipping update');
    return;
  }

  // Extract existing entries
  const inputEntries = inputMatch[1]
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  const outputEntries = outputMatch[1]
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  // Add new service
  inputEntries.push(`'./schemas/${config.serviceName}.json'`);
  outputEntries.push(`'./src/${config.serviceName}'`);

  // Generate new config
  const newConfig = `import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: [${inputEntries.join(', ')}],
  output: [${outputEntries.join(', ')}],
});
`;

  fs.writeFileSync(openapiConfigPath, newConfig);
}

function updateApiClientIndex(config: ServiceConfig): void {
  if (config.serviceType !== 'fastapi') {
    return;
  }

  const apiClientDir = path.join(__dirname, '../../../packages/api-client');
  const indexPath = path.join(apiClientDir, 'src', 'index.ts');

  if (!fs.existsSync(indexPath)) {
    console.log('⚠ api-client/src/index.ts not found, skipping update');
    return;
  }

  const content = fs.readFileSync(indexPath, 'utf-8');

  // Convert service-name to PascalCase for namespace
  const namespaceName = config.serviceName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const exportLine = `export * as ${namespaceName} from './${config.serviceName}';`;

  // Check if export already exists
  if (content.includes(exportLine) || content.includes(`from './${config.serviceName}'`)) {
    return;
  }

  // Add export at the end
  const newContent = `${content.trimEnd()}\n${exportLine}\n`;
  fs.writeFileSync(indexPath, newContent);
}

async function generateService(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Генератор микросервисов Supreme Infrastructure');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const config = await promptServiceConfig();

  console.log('');
  console.log('📋 Конфигурация сервиса:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Название: ${config.serviceName}`);
  const typeLabel =
    config.serviceType === 'nest' ? 'NestJS' : config.serviceType === 'fastapi' ? 'FastAPI (Python)' : 'Next.js';
  console.log(`  Тип: ${typeLabel}`);
  console.log(`  Описание: ${config.description}`);
  console.log(`  Порт: ${config.port}`);
  if (config.serviceType === 'nest' || config.serviceType === 'fastapi') {
    console.log(`  API префикс: ${config.apiPrefix}`);
    console.log(`  База данных: ${config.hasDatabase ? 'Да' : 'Нет'}`);
    if (config.hasDatabase) {
      console.log(`    - Название БД: ${config.databaseName}`);
      console.log(`    - Пользователь: ${config.databaseUser}`);
      console.log(`    - GitHub Secret: ${config.databasePasswordSecret}`);
    }
  }
  console.log('');

  const confirmCreate = await select({
    message: 'Создать сервис с этими настройками?',
    choices: [
      { name: 'Да, создать сервис', value: true },
      { name: 'Нет, отменить', value: false },
    ],
    default: true,
  });

  if (!confirmCreate) {
    console.log('❌ Генерация отменена');
    return;
  }

  console.log('');
  console.log('📦 Создание сервиса...');
  console.log('───────────────────────────────────────────────────────────');

  const serviceDir = path.join(SERVICES_DIR, config.serviceName);
  const templateDir = path.join(TEMPLATES_DIR, config.serviceType);

  try {
    // Copy template files
    console.log(`→ Копирование шаблонов ${config.serviceType}...`);
    copyTemplateDirectory(templateDir, serviceDir, config);
    console.log(`✓ Файлы сервиса созданы в: services/${config.serviceName}`);

    // Generate Grafana dashboard
    console.log('→ Генерация Grafana дашборда...');
    generateGrafanaDashboard(config);
    console.log(`✓ Grafana дашборд создан: infra/helmcharts/grafana/dashboards/${config.serviceName}-metrics.json`);

    // Generate database files if needed
    if (config.hasDatabase && (config.serviceType === 'nest' || config.serviceType === 'fastapi')) {
      console.log('→ Генерация конфигурации базы данных...');
      generateDatabaseInitScript(config);
      console.log(`  ✓ init.sql создан: infra/databases/${config.serviceName}-db/init.sql`);
      generateDatabaseServiceYaml(config);
      console.log(`  ✓ service.yaml создан: infra/databases/${config.serviceName}-db/service.yaml`);
    }

    // Update services.yaml
    console.log('→ Обновление services.yaml...');
    updateServicesYaml(config);
    console.log('✓ services.yaml обновлен');

    // Update openapi-ts.config.ts for FastAPI services
    if (config.serviceType === 'fastapi') {
      console.log('→ Обновление openapi-ts.config.ts...');
      updateOpenapiTsConfig(config);
      console.log('✓ openapi-ts.config.ts обновлен');

      console.log('→ Обновление api-client/src/index.ts...');
      updateApiClientIndex(config);
      console.log('✓ api-client/src/index.ts обновлен');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Сервис успешно создан!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Следующие шаги:');
    console.log('');
    console.log(`  1. Установите зависимости:`);
    if (config.serviceType === 'fastapi') {
      console.log(`     cd services/${config.serviceName} && uv sync`);
    } else {
      console.log(`     cd services/${config.serviceName} && pnpm install`);
    }
    console.log('');
    console.log(`  2. Запустите генераторы инфраструктуры:`);
    console.log(`     pnpm run generate`);
    console.log('');
    console.log(`  3. Запустите сервис локально:`);
    if (config.serviceType === 'fastapi') {
      console.log(
        `     cd services/${config.serviceName} && uv run uvicorn app.main:app --reload --port ${config.port}`,
      );
    } else {
      console.log(`     cd services/${config.serviceName} && pnpm run dev`);
    }
    console.log('');

    if (config.hasDatabase) {
      console.log(`  4. Настройте базу данных:`);
      console.log(`     - Отредактируйте init.sql в infra/databases/${config.serviceName}-db/`);
      console.log(`     - Настройте ресурсы в service.yaml в infra/databases/${config.serviceName}-db/`);
      console.log(`     - Добавьте GitHub Secret: ${config.databasePasswordSecret}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('');
    console.error('❌ Ошибка при создании сервиса:', error);
    process.exit(1);
  }
}

generateService().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
