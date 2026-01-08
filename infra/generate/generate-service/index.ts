import * as fs from 'node:fs';
import * as path from 'node:path';
import { input, number, select } from '@inquirer/prompts';
import Handlebars from 'handlebars';
import * as yaml from 'yaml';

interface ServiceConfig {
  serviceName: string;
  serviceType: 'nest' | 'next';
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
        name: string;
        user: string;
        passwordSecret: string;
      };
    }>;
    next: Array<{
      name: string;
      description: string;
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
    ],
  });

  const description = await input({
    message: 'Описание сервиса:',
    validate: (value: string) => (value ? true : 'Описание обязательно'),
  });

  const port = await number({
    message: 'Порт для локальной разработки:',
    default: serviceType === 'nest' ? 4000 : 3000,
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

  if (serviceType === 'nest') {
    apiPrefix = await input({
      message: 'API префикс (для NestJS):',
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
    serviceType: serviceType as 'nest' | 'next',
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

function generateEnvExample(serviceDir: string, config: ServiceConfig): void {
  const templatePath = path.join(COMMON_TEMPLATES_DIR, config.serviceType, 'env.example.hbs');
  const targetPath = path.join(serviceDir, '.env.example');
  copyTemplateFile(templatePath, targetPath, config, true);
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
  if (!config.hasDatabase || config.serviceType !== 'nest') {
    return;
  }

  const dbDir = path.join(__dirname, '../../databases', `${config.serviceName}-db`);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Generate init.sql
  const initSqlTemplatePath = path.join(COMMON_TEMPLATES_DIR, 'nest', 'database-init.sql.hbs');
  const initSqlTargetPath = path.join(dbDir, 'init.sql');
  copyTemplateFile(initSqlTemplatePath, initSqlTargetPath, config, true);
}

function copyTemplateDirectory(templateDir: string, targetDir: string, config: ServiceConfig): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const items = fs.readdirSync(templateDir);

  for (const item of items) {
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
    servicesConfig = { services: { nest: [], next: [] } };
  }

  if (config.serviceType === 'nest') {
    const serviceEntry: ServicesYaml['services']['nest'][0] = {
      name: config.serviceName,
      description: config.description,
    };

    if (config.hasDatabase && config.databaseName && config.databaseUser && config.databasePasswordSecret) {
      serviceEntry.database = {
        enabled: true,
        name: config.databaseName,
        user: config.databaseUser,
        passwordSecret: config.databasePasswordSecret,
      };
    }

    servicesConfig.services.nest.push(serviceEntry);
  } else {
    servicesConfig.services.next.push({
      name: config.serviceName,
      description: config.description,
    });
  }

  const yamlContent = yaml.stringify(servicesConfig);
  fs.writeFileSync(SERVICES_YAML_PATH, yamlContent);
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
  console.log(`  Тип: ${config.serviceType === 'nest' ? 'NestJS' : 'Next.js'}`);
  console.log(`  Описание: ${config.description}`);
  console.log(`  Порт: ${config.port}`);
  if (config.serviceType === 'nest') {
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

    // Generate .env.example
    console.log('→ Генерация .env.example...');
    generateEnvExample(serviceDir, config);
    console.log(`✓ .env.example создан`);

    // Generate Grafana dashboard
    console.log('→ Генерация Grafana дашборда...');
    generateGrafanaDashboard(config);
    console.log(`✓ Grafana дашборд создан: infra/helmcharts/grafana/dashboards/${config.serviceName}-metrics.json`);

    // Generate database init script if needed
    if (config.hasDatabase && config.serviceType === 'nest') {
      console.log('→ Генерация init.sql для базы данных...');
      generateDatabaseInitScript(config);
      console.log(`✓ init.sql создан: infra/databases/${config.serviceName}-db/init.sql`);
    }

    // Update services.yaml
    console.log('→ Обновление services.yaml...');
    updateServicesYaml(config);
    console.log('✓ services.yaml обновлен');

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Сервис успешно создан!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Следующие шаги:');
    console.log('');
    console.log(`  1. Установите зависимости:`);
    console.log(`     cd services/${config.serviceName} && pnpm install`);
    console.log('');
    console.log(`  2. Запустите генераторы инфраструктуры:`);
    console.log(`     pnpm run generate`);
    console.log('');
    console.log(`  3. Запустите сервис локально:`);
    console.log(`     cd services/${config.serviceName} && pnpm run dev`);
    console.log('');

    if (config.hasDatabase) {
      console.log(`  4. Настройте базу данных:`);
      console.log(`     - Отредактируйте init.sql в infra/databases/${config.serviceName}-db/`);
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
