import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { getServicesByType } from '../shared/load-services';

export function updateSecurityChecks(): void {
  // Путь к корню проекта (относительно текущего файла)
  const projectRoot = path.join(__dirname, '../../..');

  // Загружаем сервисы из services.yaml
  const nestServices = getServicesByType('nest').map((s) => s.name);
  const nextServices = getServicesByType('next').map((s) => s.name);

  // Читаем security-checks.yml
  const securityChecksPath = path.join(
    projectRoot,
    '.github',
    'workflows',
    'security-checks.yml',
  );
  const securityChecksContent = fs.readFileSync(securityChecksPath, 'utf-8');

  // Парсим YAML
  const workflow = yaml.parseDocument(securityChecksContent);

  // Получаем jobs
  const jobs = workflow.get('jobs') as yaml.YAMLMap;

  // Обновляем security-scan-nest
  const securityScanNest = jobs?.get('security-scan-nest') as yaml.YAMLMap;
  if (securityScanNest) {
    const strategy = securityScanNest.get('strategy') as yaml.YAMLMap;
    const matrix = strategy?.get('matrix') as yaml.YAMLMap;
    if (matrix) {
      matrix.set('service-name', nestServices);
    }
  }

  // Обновляем security-scan-next
  const securityScanNext = jobs?.get('security-scan-next') as yaml.YAMLMap;
  if (securityScanNext) {
    const strategy = securityScanNext.get('strategy') as yaml.YAMLMap;
    const matrix = strategy?.get('matrix') as yaml.YAMLMap;
    if (matrix) {
      matrix.set('service-name', nextServices);
    }
  }

  // Сохраняем обновленный файл
  fs.writeFileSync(securityChecksPath, workflow.toString(), 'utf-8');

  console.log('✓ Security checks updated successfully!');
  console.log(`  Nest services: ${nestServices.join(', ') || 'none'}`);
  console.log(`  Next services: ${nextServices.join(', ') || 'none'}`);
}
