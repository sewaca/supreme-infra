import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getServicesByType } from '../shared/load-services';

export function updateSecurityChecks(): void {
  // Путь к корню проекта (относительно текущего файла)
  const projectRoot = join(__dirname, '../..');

  // Загружаем сервисы из services.yaml
  const nestServices = getServicesByType('nest').map(s => s.name);
  const nextServices = getServicesByType('next').map(s => s.name);

  // Читаем security-checks.yml
  const securityChecksPath = join(
    projectRoot,
    '.github',
    'workflows',
    'security-checks.yml',
  );
  let securityChecksContent = readFileSync(securityChecksPath, 'utf-8');

  // Формируем строку для matrix nest сервисов
  const nestMatrixValue =
    nestServices.length > 0
      ? `service-name: [${nestServices.map((s) => `'${s}'`).join(', ')}]`
      : `service-name: []`;

  // Формируем строку для matrix next сервисов
  const nextMatrixValue =
    nextServices.length > 0
      ? `service-name: [${nextServices.map((s) => `'${s}'`).join(', ')}]`
      : `service-name: []`;

  // Обновляем matrix для nest сервисов (строки 11-13)
  // Ищем блок strategy с matrix для security-scan-nest, используя контекст
  // Учитываем многострочный формат YAML с отступами
  const nestMatrixRegex =
    /(security-scan-nest:[\s\S]*?strategy:\s+matrix:\s+)(service-name:\s+\[.*?\])/s;
  const nestReplacement = `$1${nestMatrixValue}`;
  securityChecksContent = securityChecksContent.replace(
    nestMatrixRegex,
    nestReplacement,
  );

  // Обновляем matrix для next сервисов (строки 26-28)
  // Ищем блок strategy с matrix для security-scan-next, используя контекст
  // Учитываем многострочный формат YAML с отступами
  const nextMatrixRegex =
    /(security-scan-next:[\s\S]*?strategy:\s+matrix:\s+)(service-name:\s+\[.*?\])/s;
  const nextReplacement = `$1${nextMatrixValue}`;
  securityChecksContent = securityChecksContent.replace(
    nextMatrixRegex,
    nextReplacement,
  );

  // Сохраняем обновленный файл
  writeFileSync(securityChecksPath, securityChecksContent, 'utf-8');

  console.log('✓ Security checks updated successfully!');
  console.log(`  Nest services: ${nestServices.join(', ') || 'none'}`);
  console.log(`  Next services: ${nextServices.join(', ') || 'none'}`);
}
