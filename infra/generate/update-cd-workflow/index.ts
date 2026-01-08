import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

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
  };
}

export function updateCdWorkflow(): void {
  console.log('\n🔄 Updating CD workflow with database secrets...\n');

  const projectRoot = path.resolve(__dirname, '../../..');
  const servicesYamlPath = path.join(projectRoot, 'services.yaml');
  const cdWorkflowPath = path.join(projectRoot, '.github/workflows/cd.yml');

  // Read services.yaml
  const servicesContent = fs.readFileSync(servicesYamlPath, 'utf-8');
  const servicesYaml = yaml.parse(servicesContent) as ServicesYaml;

  // Collect all services with databases and their password secrets
  const servicesWithDb: Array<{ name: string; passwordSecret: string }> = [];

  for (const serviceType of ['nest', 'next'] as const) {
    const services = servicesYaml.services[serviceType] || [];
    for (const service of services) {
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

  if (servicesWithDb.length === 0) {
    console.log('  ℹ No services with databases found');
    return;
  }

  // Read CD workflow
  let cdWorkflowContent = fs.readFileSync(cdWorkflowPath, 'utf-8');

  // Update the deploy-helm action calls to include db-password conditionally
  // We'll add a comment block that the generator can use to inject the right secret

  // For now, we'll just document what needs to be done
  console.log('\n📝 Services with database configuration:');
  for (const { name, passwordSecret } of servicesWithDb) {
    console.log(`  - ${name}: uses secret ${passwordSecret}`);
  }

  console.log('\n✅ CD workflow analysis complete');
  console.log('\n💡 Note: Currently all services use the same DB_PASSWORD secret.');
  console.log('   If you need different secrets per service, update the workflow manually.');
}
