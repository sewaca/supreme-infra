import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

import { formatWorkflowYamlWithPrettier } from '../format-workflow-yaml-with-prettier';

interface DatabaseConfig {
  enabled: boolean;
  name?: string;
  user?: string;
  passwordSecret?: string;
}

interface ServiceConfig {
  name: string;
  description?: string;
  database?: DatabaseConfig;
}

interface ServicesYaml {
  services: {
    nest?: ServiceConfig[];
    next?: ServiceConfig[];
    fastapi?: ServiceConfig[];
  };
}

// Inputs in cd-multi.yml that are not service booleans (generator must not touch them)
const NON_SERVICE_INPUTS = new Set(['deployment-options', 'skip-canary']);

export async function updateCdWorkflow(): Promise<void> {
  console.log('\n🔄 Updating CD workflow...\n');

  const projectRoot = path.resolve(__dirname, '../../..');
  const servicesYamlPath = path.join(projectRoot, 'services.yaml');
  const cdWorkflowPath = path.join(projectRoot, '.github/workflows/cd.yml');

  // Read services.yaml
  const servicesContent = fs.readFileSync(servicesYamlPath, 'utf-8');
  const servicesYaml = yaml.parse(servicesContent) as ServicesYaml;

  // Collect all services
  const allServices: string[] = [];
  const servicesWithDb: Array<{ name: string; passwordSecret: string }> = [];

  for (const serviceType of ['nest', 'next', 'fastapi'] as const) {
    const services = servicesYaml.services[serviceType] || [];
    for (const service of services) {
      allServices.push(service.name);

      if (service.database?.enabled) {
        const passwordSecret = service.database.passwordSecret || 'DB_PASSWORD';
        servicesWithDb.push({
          name: service.name,
          passwordSecret,
        });
        console.log(`  ✓ Found service: ${service.name} (secret: ${passwordSecret})`);
      }
    }
  }

  if (allServices.length === 0) {
    console.log('  ℹ No services found');
    return;
  }

  allServices.sort();

  // Read and parse CD workflow (preserving comments)
  const cdWorkflowContent = fs.readFileSync(cdWorkflowPath, 'utf-8');
  const cdWorkflow = yaml.parseDocument(cdWorkflowContent);

  // Update service options in workflow_dispatch
  const serviceInput = cdWorkflow.getIn(['on', 'workflow_dispatch', 'inputs', 'service']) as yaml.YAMLMap | undefined;

  if (serviceInput && yaml.isMap(serviceInput)) {
    // Update options
    serviceInput.set('options', allServices);

    // Update default to first service
    if (allServices.length > 0) {
      serviceInput.set('default', allServices[0]);
    }

    // Write back to file (preserving comments and formatting)
    const updatedContent = cdWorkflow.toString();

    fs.writeFileSync(cdWorkflowPath, updatedContent, 'utf-8');
    await formatWorkflowYamlWithPrettier(cdWorkflowPath);
    console.log(`\n✅ Updated: ${cdWorkflowPath}`);
    console.log(`  Services: ${allServices.join(', ')}`);
    console.log(`  Default: ${allServices[0]}`);
  } else {
    console.log('\n⚠️  Could not find service options in workflow');
  }

  // Log database configuration
  if (servicesWithDb.length > 0) {
    console.log('\n📝 Services with database configuration:');
    for (const { name, passwordSecret } of servicesWithDb) {
      console.log(`  - ${name}: uses secret ${passwordSecret}`);
    }
  }

  // Also update cd-multi.yml
  await updateCdMultiWorkflow(allServices, projectRoot);
}

async function updateCdMultiWorkflow(allServices: string[], projectRoot: string): Promise<void> {
  console.log('\n🔄 Updating CD Multi workflow...\n');

  const cdMultiWorkflowPath = path.join(projectRoot, '.github/workflows/cd-multi.yml');

  if (!fs.existsSync(cdMultiWorkflowPath)) {
    console.log('  ⚠️  cd-multi.yml not found, skipping');
    return;
  }

  const cdMultiContent = fs.readFileSync(cdMultiWorkflowPath, 'utf-8');
  const cdMultiWorkflow = yaml.parseDocument(cdMultiContent);

  const inputs = cdMultiWorkflow.getIn(['on', 'workflow_dispatch', 'inputs'], true) as yaml.YAMLMap | undefined;

  if (!inputs || !yaml.isMap(inputs)) {
    console.log('  ⚠️  Could not find inputs map in cd-multi.yml');
    return;
  }

  // Preserve non-service input pairs (separator + skip-canary) in original order
  const preservedPairs = inputs.items.filter((item) =>
    NON_SERVICE_INPUTS.has(String((item as yaml.Pair).key)),
  ) as yaml.Pair[];

  // Rebuild: clear all items, add sorted service booleans, then preserved inputs
  inputs.items = [];

  for (const serviceName of allServices) {
    const serviceInputNode = cdMultiWorkflow.createNode({
      description: serviceName,
      required: false,
      type: 'boolean',
      default: false,
    });
    inputs.add(new yaml.Pair(cdMultiWorkflow.createNode(serviceName), serviceInputNode));
  }

  for (const pair of preservedPairs) {
    inputs.items.push(pair);
  }

  const updatedContent = cdMultiWorkflow.toString();
  fs.writeFileSync(cdMultiWorkflowPath, updatedContent, 'utf-8');
  await formatWorkflowYamlWithPrettier(cdMultiWorkflowPath);

  console.log(`✅ Updated: ${cdMultiWorkflowPath}`);
  console.log(`  Services: ${allServices.join(', ')}`);
}
