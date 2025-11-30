import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { getAllServiceNames } from '../shared/load-services';

export function updateCdWorkflow(): void {
  // Путь к корню проекта (относительно текущего файла)
  const projectRoot = path.join(__dirname, '../../..');

  // Загружаем все сервисы из services.yaml
  const allServices = getAllServiceNames();

  if (allServices.length === 0) {
    console.error('✗ Error: No services found in services.yaml');
    process.exit(1);
  }

  // Читаем cd.yml
  const cdWorkflowPath = path.join(projectRoot, '.github', 'workflows', 'cd.yml');
  const cdWorkflowContent = fs.readFileSync(cdWorkflowPath, 'utf-8');

  // Парсим YAML
  const workflow = yaml.parseDocument(cdWorkflowContent);

  // Находим секцию workflow_dispatch -> inputs -> service -> options
  const workflowDispatch = workflow.get('on') as yaml.YAMLMap;
  const workflowDispatchNode = workflowDispatch?.get('workflow_dispatch') as yaml.YAMLMap;
  const inputs = workflowDispatchNode?.get('inputs') as yaml.YAMLMap;
  const service = inputs?.get('service') as yaml.YAMLMap;

  if (!service) {
    console.error('✗ Error: Could not find workflow_dispatch.inputs.service in cd.yml');
    process.exit(1);
  }

  // Обновляем options
  service.set('options', allServices);

  // Обновляем default (первый сервис)
  const defaultService = allServices[0];
  service.set('default', defaultService);

  // Сохраняем обновленный файл
  fs.writeFileSync(cdWorkflowPath, workflow.toString(), 'utf-8');

  console.log('✓ CD workflow updated successfully!');
  console.log(`  Services: ${allServices.join(', ')}`);
  console.log(`  Default service: ${defaultService}`);
}

