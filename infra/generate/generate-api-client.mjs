#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');

console.log('═══════════════════════════════════════════════════════════');
console.log('🔄 Генерация API клиентов для FastAPI сервисов');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Read services.yaml to get list of FastAPI services
const servicesYamlPath = join(rootDir, 'services.yaml');
const servicesYaml = readFileSync(servicesYamlPath, 'utf-8');
const servicesConfig = parse(servicesYaml);
const fastapiServices = servicesConfig.services.fastapi || [];

console.log(`Найдено FastAPI сервисов: ${fastapiServices.length}`);
console.log('');

// Step 1: Export OpenAPI schemas from all FastAPI services
console.log('📋 Шаг 1: Экспорт OpenAPI схем');
console.log('───────────────────────────────────────────────────────────');

for (const service of fastapiServices) {
  const serviceName = service.name;
  const servicePath = join(rootDir, 'services', serviceName);

  try {
    console.log(`→ Экспорт схемы для ${serviceName}...`);
    execSync('uv run python scripts/export_openapi.py', {
      cwd: servicePath,
      stdio: 'inherit',
    });
    console.log(`✓ ${serviceName}: схема экспортирована`);
  } catch (error) {
    console.error(`✗ ${serviceName}: ошибка при экспорте схемы`);
    console.error(error.message);
    process.exit(1);
  }
}

console.log('');

// Step 2: Copy schemas to api-client package
console.log('📦 Шаг 2: Копирование схем в packages/api-client');
console.log('───────────────────────────────────────────────────────────');

try {
  const apiClientPath = join(rootDir, 'packages/api-client');
  execSync('node scripts/copy-schemas.mjs', {
    cwd: apiClientPath,
    stdio: 'inherit',
  });
} catch (error) {
  console.error('✗ Ошибка при копировании схем');
  console.error(error.message);
  process.exit(1);
}

console.log('');

// Step 3: Generate TypeScript clients
console.log('🔨 Шаг 3: Генерация TypeScript клиентов');
console.log('───────────────────────────────────────────────────────────');

try {
  const apiClientPath = join(rootDir, 'packages/api-client');
  execSync('pnpm run generate', {
    cwd: apiClientPath,
    stdio: 'inherit',
  });
} catch (error) {
  console.error('✗ Ошибка при генерации клиентов');
  console.error(error.message);
  process.exit(1);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('✅ Генерация API клиентов завершена!');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📝 Сгенерированные клиенты доступны в:');
console.log('   packages/api-client/src/');
console.log('');
console.log('Импортируйте их в SSR сервисах:');
console.log("   import { ... } from '@supreme-int/api-client';");
console.log('');
