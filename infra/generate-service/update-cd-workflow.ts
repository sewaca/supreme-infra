import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllServiceNames } from '../shared/load-services';

export function updateCdWorkflow(): void {
  // Путь к корню проекта (относительно текущего файла)
  const projectRoot = join(__dirname, '../..');

  // Загружаем все сервисы из services.yaml
  const allServices = getAllServiceNames();

  if (allServices.length === 0) {
    console.error('✗ Error: No services found in services.yaml');
    process.exit(1);
  }

  // Читаем cd.yml
  const cdWorkflowPath = join(projectRoot, '.github', 'workflows', 'cd.yml');
  const cdWorkflowContent = readFileSync(cdWorkflowPath, 'utf-8');

  // Разбиваем файл на строки
  const lines = cdWorkflowContent.split('\n');

  // Находим строку с "options:" (должна быть на строке 10, индекс 9)
  const optionsLineIndex = lines.findIndex(
    (line) => line.trim() === 'options:',
  );

  if (optionsLineIndex === -1) {
    console.error('✗ Error: Could not find "options:" line in cd.yml');
    process.exit(1);
  }

  // Генерируем новые строки для options (строки 11-12)
  const optionsLines = allServices.map((service) => `          - ${service}`);

  // Генерируем строку default (строка 13)
  const defaultService = allServices[0];
  const defaultLine = `        default: '${defaultService}'`;

  // Заменяем строки 11-13 (индексы 10-12)
  // Сначала удаляем старые строки options и default
  // Находим, где заканчивается блок options (ищем строку с default)
  let defaultLineIndex = -1;
  for (let i = optionsLineIndex + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('default:')) {
      defaultLineIndex = i;
      break;
    }
  }

  if (defaultLineIndex === -1) {
    console.error('✗ Error: Could not find "default:" line in cd.yml');
    process.exit(1);
  }

  // Удаляем все строки между options и default (включая старые опции)
  // и саму строку default
  const linesToRemove = defaultLineIndex - optionsLineIndex;
  lines.splice(optionsLineIndex + 1, linesToRemove);

  // Вставляем новые строки options и default после строки "options:"
  lines.splice(optionsLineIndex + 1, 0, ...optionsLines, defaultLine);

  // Собираем файл обратно
  const updatedContent = lines.join('\n');

  // Сохраняем обновленный файл
  writeFileSync(cdWorkflowPath, updatedContent, 'utf-8');

  console.log('✓ CD workflow updated successfully!');
  console.log(`  Services: ${allServices.join(', ')}`);
  console.log(`  Default service: ${defaultService}`);
}
