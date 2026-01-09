import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { BaseChartValues, DatabaseServiceConfig, ServiceWithDatabase } from './types';

const INFRA_DIR = path.join(__dirname, '../../');
const OVERRIDES_DIR = path.join(INFRA_DIR, 'overrides');

function loadBaseChartValues(projectRoot: string): BaseChartValues {
  const baseValuesPath = path.join(projectRoot, 'infra/helmcharts/postgresql/values.yaml');

  if (!fs.existsSync(baseValuesPath)) {
    throw new Error(`Base chart values not found at: ${baseValuesPath}`);
  }

  const baseValuesContent = fs.readFileSync(baseValuesPath, 'utf-8');
  return yaml.parse(baseValuesContent) as BaseChartValues;
}

function getDefaultDatabaseValues(
  serviceName: string,
  dbName: string,
  dbUser: string,
  baseChartValues: BaseChartValues,
): Record<string, unknown> {
  // Clone base values and set service-specific fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { overrides: _overrides, ...baseValues } = baseChartValues;

  return {
    ...baseValues,
    nameOverride: `postgresql-${serviceName}`,
    fullnameOverride: `postgresql-${serviceName}`,
    database: {
      name: dbName,
      user: dbUser,
    },
  };
}

// Helper to deep merge objects
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!source) return target;
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge((target[key] as Record<string, unknown>) || {}, source[key] as Record<string, unknown>);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

function getServiceConfig(serviceName: string, projectRoot: string): DatabaseServiceConfig | null {
  const dbServiceYamlPath = path.join(projectRoot, 'infra/databases', `${serviceName}-db/service.yaml`);

  if (fs.existsSync(dbServiceYamlPath)) {
    const dbServiceContent = fs.readFileSync(dbServiceYamlPath, 'utf-8');
    const serviceConfig = yaml.parse(dbServiceContent) as DatabaseServiceConfig;
    console.log(`  ✓ Found database service config: infra/databases/${serviceName}-db/service.yaml`);
    return serviceConfig;
  }

  return null;
}

function buildFinalValues(
  baseValues: Record<string, unknown>,
  baseChartOverrides: Record<string, unknown> | undefined,
  serviceConfig: DatabaseServiceConfig | null,
  environment: 'development' | 'production',
  initScript: string,
): Record<string, unknown> {
  // Start with base values
  let result: Record<string, unknown> = { ...baseValues };

  // Apply base chart environment overrides (priority 2)
  if (baseChartOverrides) {
    result = deepMerge(result, baseChartOverrides);
  }

  if (!serviceConfig) {
    // No service config, return base values + chart overrides + init script
    if (initScript) {
      result.initScript = initScript;
    }
    return result;
  }

  // Extract known fields and environment overrides from service.yaml
  const { persistence, resources, image, service, overrides, ...unknownProps } = serviceConfig;

  // Apply base-level overrides from service.yaml (priority 3)
  if (persistence) {
    result.persistence = deepMerge(
      result.persistence as Record<string, unknown>,
      persistence as Record<string, unknown>,
    );
  }
  if (resources) {
    result.resources = resources;
  }
  if (image) {
    result.image = deepMerge(result.image as Record<string, unknown>, image as Record<string, unknown>);
  }
  if (service) {
    result.service = deepMerge(result.service as Record<string, unknown>, service as Record<string, unknown>);
  }

  // Apply environment-specific overrides from service.yaml (priority 4 - highest)
  const envOverride = overrides?.[environment];
  if (envOverride) {
    result = deepMerge(result, envOverride);
  }

  // Add unknown properties as-is
  for (const key in unknownProps) {
    if (unknownProps[key] !== undefined) {
      result[key] = unknownProps[key];
    }
  }

  // Add init script if exists
  if (initScript) {
    result.initScript = initScript;
  }

  return result;
}

function generateDatabaseValuesForService(service: ServiceWithDatabase, baseChartValues: BaseChartValues): void {
  if (!service.database?.enabled) {
    return;
  }

  const serviceName = service.name;
  const projectRoot = path.join(__dirname, '../../..');

  // Get database name and user from services.yaml
  const dbName = service.database.name || `${serviceName.replace(/-/g, '_')}_db`;
  const dbUser = service.database.user || `${serviceName.replace(/-/g, '_')}_user`;

  console.log(`→ Generating database values for service: ${serviceName}`);

  // Read init script if exists
  const initScriptPath = path.join(projectRoot, 'infra/databases', `${serviceName}-db/init.sql`);
  let initScript = '';
  if (fs.existsSync(initScriptPath)) {
    initScript = fs.readFileSync(initScriptPath, 'utf-8');
    console.log(`  ✓ Found init script: infra/databases/${serviceName}-db/init.sql`);
  }

  // Get service configuration
  const serviceConfig = getServiceConfig(serviceName, projectRoot);

  // Generate values for each environment
  const environments: Array<'development' | 'production'> = ['development', 'production'];

  for (const env of environments) {
    const baseValues = getDefaultDatabaseValues(serviceName, dbName, dbUser, baseChartValues);
    const baseChartEnvOverrides = baseChartValues.overrides?.[env] as Record<string, unknown> | undefined;
    const finalValues = buildFinalValues(baseValues, baseChartEnvOverrides, serviceConfig, env, initScript);

    // Add header comment
    const header = [
      '# This file is automatically generated and should not be edited manually!',
      `# Generated database values for ${serviceName} in ${env} environment`,
      `# Database: ${dbName}`,
      `# User: ${dbUser}`,
      '',
    ].join('\n');

    const yamlContent = header + yaml.stringify(finalValues);

    // Write to file
    const envDir = path.join(OVERRIDES_DIR, env);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }

    const outputPath = path.join(envDir, `postgresql-${serviceName}.yaml`);
    fs.writeFileSync(outputPath, yamlContent, 'utf-8');
    console.log(`✓ Generated: ${path.relative(process.cwd(), outputPath)}`);
  }
}

export function generateDatabaseValues(): void {
  console.log('→ Starting database values generation process');

  const projectRoot = path.join(__dirname, '../../..');

  // Load base chart values
  const baseChartValues = loadBaseChartValues(projectRoot);

  // Load services configuration
  const servicesPath = path.join(__dirname, '../../../services.yaml');
  const servicesContent = fs.readFileSync(servicesPath, 'utf-8');
  const servicesConfig = yaml.parse(servicesContent);

  const allServices: ServiceWithDatabase[] = [
    ...(servicesConfig.services.nest || []),
    ...(servicesConfig.services.next || []),
  ];

  const servicesWithDb = allServices.filter((s) => s.database?.enabled);

  console.log(`→ Found ${servicesWithDb.length} service(s) with database enabled:`);
  for (const service of servicesWithDb) {
    console.log(`→   • ${service.name} (${service.database?.name || `${service.name}_db`})`);
  }

  let generatedCount = 0;
  for (const service of servicesWithDb) {
    generateDatabaseValuesForService(service, baseChartValues);
    generatedCount += 2; // development + production
  }

  console.log('→ Generation summary:');
  console.log(`✓   Total files generated: ${generatedCount}`);
}
