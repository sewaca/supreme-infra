import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

interface ServiceWithDatabase {
  name: string;
  database?: {
    enabled: boolean;
  };
}

export function updateDatabaseWorkflow(): void {
  console.log('→ Starting database workflow update');

  // Load services configuration
  const servicesPath = path.join(__dirname, '../../../services.yaml');
  const servicesContent = fs.readFileSync(servicesPath, 'utf-8');
  const servicesConfig = yaml.parse(servicesContent);

  const allServices: ServiceWithDatabase[] = [
    ...(servicesConfig.services.nest || []),
    ...(servicesConfig.services.next || []),
  ];

  // Filter services with database enabled
  const servicesWithDb = allServices.filter((s) => s.database?.enabled).map((s) => s.name);

  if (servicesWithDb.length === 0) {
    console.log('⚠️  No services with database enabled found');
    return;
  }

  console.log(`→ Found ${servicesWithDb.length} service(s) with database:`);
  for (const service of servicesWithDb) {
    console.log(`→   • ${service}`);
  }

  // Read workflow file
  const workflowPath = path.join(__dirname, '../../../.github/workflows/deploy-database.yml');
  const workflowContent = fs.readFileSync(workflowPath, 'utf-8');

  // Parse YAML (preserving comments and formatting)
  const workflow = yaml.parseDocument(workflowContent);

  // Update service options
  const serviceInput = workflow.getIn(['on', 'workflow_dispatch', 'inputs', 'service']) as yaml.YAMLMap | undefined;

  if (serviceInput && yaml.isMap(serviceInput)) {
    serviceInput.set('options', servicesWithDb);
    serviceInput.set('default', servicesWithDb[0]);
  }

  // Write back (preserving comments and formatting)
  const updatedContent = workflow.toString();

  fs.writeFileSync(workflowPath, updatedContent, 'utf-8');

  console.log('✓ Updated: .github/workflows/deploy-database.yml');
  console.log(`→   Services: ${servicesWithDb.join(', ')}`);
  console.log(`→   Default: ${servicesWithDb[0]}`);
}
