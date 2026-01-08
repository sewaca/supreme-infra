import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import inquirer from 'inquirer';
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
const SERVICES_DIR = path.join(__dirname, '../../../services');
const SERVICES_YAML_PATH = path.join(__dirname, '../../../services.yaml');

async function promptServiceConfig(): Promise<ServiceConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'serviceName',
      message: 'Название сервиса (например: auth-bff, user-service):',
      validate: (input: string) => {
        if (!input) return 'Название сервиса обязательно';
        if (!/^[a-z0-9-]+$/.test(input)) return 'Используйте только строчные буквы, цифры и дефисы';
        const servicePath = path.join(SERVICES_DIR, input);
        if (fs.existsSync(servicePath)) return `Сервис ${input} уже существует`;
        return true;
      },
    },
    {
      type: 'list',
      name: 'serviceType',
      message: 'Тип сервиса:',
      choices: [
        { name: 'NestJS (Backend)', value: 'nest' },
        { name: 'Next.js (Frontend)', value: 'next' },
      ],
    },
    {
      type: 'input',
      name: 'description',
      message: 'Описание сервиса:',
      validate: (input: string) => (input ? true : 'Описание обязательно'),
    },
    {
      type: 'number',
      name: 'port',
      message: 'Порт для локальной разработки:',
      default: (answers: { serviceType: string }) => (answers.serviceType === 'nest' ? 4000 : 3000),
      validate: (input: number) => {
        if (!input || input < 1024 || input > 65535) return 'Порт должен быть от 1024 до 65535';
        return true;
      },
    },
    {
      type: 'input',
      name: 'apiPrefix',
      message: 'API префикс (для NestJS):',
      default: (answers: { serviceName: string }) => answers.serviceName,
      when: (answers: { serviceType: string }) => answers.serviceType === 'nest',
    },
    {
      type: 'confirm',
      name: 'hasDatabase',
      message: 'Нужна ли сервису база данных PostgreSQL?',
      default: false,
      when: (answers: { serviceType: string }) => answers.serviceType === 'nest',
    },
    {
      type: 'input',
      name: 'databaseName',
      message: 'Название базы данных:',
      default: (answers: { serviceName: string }) => `${answers.serviceName.replace(/-/g, '_')}_db`,
      when: (answers: { hasDatabase: boolean }) => answers.hasDatabase,
      validate: (input: string) => {
        if (!input) return 'Название базы данных обязательно';
        if (!/^[a-z0-9_]+$/.test(input)) return 'Используйте только строчные буквы, цифры и подчеркивания';
        return true;
      },
    },
    {
      type: 'input',
      name: 'databaseUser',
      message: 'Имя пользователя базы данных:',
      default: (answers: { serviceName: string }) => `${answers.serviceName.replace(/-/g, '_')}_user`,
      when: (answers: { hasDatabase: boolean }) => answers.hasDatabase,
      validate: (input: string) => {
        if (!input) return 'Имя пользователя обязательно';
        if (!/^[a-z0-9_]+$/.test(input)) return 'Используйте только строчные буквы, цифры и подчеркивания';
        return true;
      },
    },
    {
      type: 'input',
      name: 'databasePasswordSecret',
      message: 'Название GitHub Secret для пароля БД:',
      default: (answers: { serviceName: string }) =>
        `${answers.serviceName.replace(/-/g, '_').toUpperCase()}_DB_PASSWORD`,
      when: (answers: { hasDatabase: boolean }) => answers.hasDatabase,
      validate: (input: string) => {
        if (!input) return 'Название секрета обязательно';
        if (!/^[A-Z0-9_]+$/.test(input)) return 'Используйте только заглавные буквы, цифры и подчеркивания';
        return true;
      },
    },
  ]);

  return answers as ServiceConfig;
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

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Создать сервис с этими настройками?',
      default: true,
    },
  ]);

  if (!confirm) {
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
      console.log(`     - Создайте init.sql в infra/databases/${config.databaseName}/`);
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
