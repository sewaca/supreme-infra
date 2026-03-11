import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../../..');
const schemasDir = join(__dirname, '../schemas');

if (!existsSync(schemasDir)) {
  mkdirSync(schemasDir, { recursive: true });
}

const servicesYamlPath = join(rootDir, 'services.yaml');
const servicesYaml = readFileSync(servicesYamlPath, 'utf-8');
const servicesConfig = parse(servicesYaml);

const fastapiServices = servicesConfig.services.fastapi || [];

console.log(`Found ${fastapiServices.length} FastAPI services`);

for (const service of fastapiServices) {
  const serviceName = service.name;
  const openapiPath = join(rootDir, 'services', serviceName, 'openapi.json');
  const targetPath = join(schemasDir, `${serviceName}.json`);

  if (existsSync(openapiPath)) {
    const schema = readFileSync(openapiPath, 'utf-8');
    writeFileSync(targetPath, schema);
    console.log(`✓ Copied ${serviceName}/openapi.json → schemas/${serviceName}.json`);
  } else {
    console.warn(`⚠ Warning: ${openapiPath} not found. Run export script first.`);
  }
}

console.log('Schema copy complete!');
