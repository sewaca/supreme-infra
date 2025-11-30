import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import * as yaml from 'yaml';
import { getServiceByName, loadServices } from '../shared/load-services';
import type { ServiceConfig, ServiceType } from './types';

const SERVICE_TYPES: Record<string, ServiceType> = {
  backend: { type: 'backend', defaultPort: 4000, defaultHealthPath: '/status' },
  frontend: {
    type: 'frontend',
    defaultPort: 3000,
    defaultHealthPath: '/api/status',
  },
};

const HELM_CHART_MAPPING: Record<string, string> = {
  nest: 'backend-service',
  next: 'frontend-service',
};

const ENVIRONMENTS = ['development', 'production'];

function log(
  message: string,
  level: 'info' | 'success' | 'error' | 'debug' = 'info',
): void {
  const prefix = {
    info: '→',
    success: '✓',
    error: '✗',
    debug: '  •',
  };
  console.log(`${prefix[level]} ${message}`);
}

function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue !== undefined) {
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue) as T[Extract<
          keyof T,
          string
        >];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

function getHelmChartPath(serviceType: 'nest' | 'next'): string {
  const chartName = HELM_CHART_MAPPING[serviceType];
  return path.join(__dirname, '../../helmcharts', chartName);
}

function loadDefaultValues(serviceType: 'nest' | 'next'): ServiceConfig {
  const helmChartPath = getHelmChartPath(serviceType);
  const valuesPath = path.join(helmChartPath, 'values.yaml');

  log(
    `Loading default values from ${HELM_CHART_MAPPING[serviceType]}/values.yaml`,
    'debug',
  );

  const content = fs.readFileSync(valuesPath, 'utf-8');
  return yaml.parse(content) as ServiceConfig;
}

function loadEnvironmentOverrides(
  serviceType: 'nest' | 'next',
): Record<string, Partial<ServiceConfig>> {
  const helmChartPath = getHelmChartPath(serviceType);
  const overridesPath = path.join(helmChartPath, 'environment-overrides.yaml');

  log(
    `Loading environment overrides from ${HELM_CHART_MAPPING[serviceType]}/environment-overrides.yaml`,
    'debug',
  );

  const content = fs.readFileSync(overridesPath, 'utf-8');
  return yaml.parse(content) as Record<string, Partial<ServiceConfig>>;
}

function detectServiceType(serviceName: string): ServiceType {
  log(`Detecting service type for: ${serviceName}`, 'debug');

  const result = getServiceByName(serviceName);

  if (!result) {
    log(`Service not found in services.yaml, defaulting to: backend`, 'debug');
    return SERVICE_TYPES.backend;
  }

  log(`Service found: ${result.service.name} (${result.type})`, 'debug');

  if (result.type === 'nest') {
    log(`Service type detected: backend (NestJS)`, 'debug');
    return SERVICE_TYPES.backend;
  }

  if (result.type === 'next') {
    log(`Service type detected: frontend (Next.js)`, 'debug');
    return SERVICE_TYPES.frontend;
  }

  log(`Unknown service type: ${result.type}, defaulting to: backend`, 'debug');
  return SERVICE_TYPES.backend;
}

function loadServiceConfig(serviceName: string): ServiceConfig {
  const serviceYamlPath = path.join(
    __dirname,
    '../../../services',
    serviceName,
    'service.yaml',
  );

  log(`Loading service config from: ${serviceYamlPath}`, 'debug');

  if (!fs.existsSync(serviceYamlPath)) {
    throw new Error(`Service config not found: ${serviceYamlPath}`);
  }

  const content = fs.readFileSync(serviceYamlPath, 'utf-8');
  const config = yaml.parse(content) as ServiceConfig;

  log(`Service config loaded successfully`, 'debug');
  return config;
}

function generateValuesForService(
  serviceName: string,
  environment: string,
): ServiceConfig {
  log(`Generating values for environment: ${environment}`, 'debug');

  const result = getServiceByName(serviceName);
  if (!result) {
    throw new Error(`Service ${serviceName} not found in services.yaml`);
  }

  const serviceType = detectServiceType(serviceName);
  const serviceConfig = loadServiceConfig(serviceName);

  // Load defaults and overrides specific to service type
  const defaultValues = loadDefaultValues(result.type);
  const environmentOverrides = loadEnvironmentOverrides(result.type);

  log(`Merging configurations...`, 'debug');

  // Start with defaults
  let values: ServiceConfig = deepMerge({}, defaultValues);

  // Apply service type defaults (already in defaults.yaml, but ensure consistency)
  log(
    `Applying service type defaults (port: ${serviceType.defaultPort})`,
    'debug',
  );
  if (!values.service) {
    values.service = {};
  }
  values.service.targetPort = serviceType.defaultPort;

  if (!values.env) {
    values.env = {};
  }
  values.env.PORT = serviceType.defaultPort.toString();

  // Update health check paths based on service type (already in defaults.yaml)
  if (values.livenessProbe?.httpGet) {
    values.livenessProbe.httpGet.path = serviceType.defaultHealthPath;
  }
  if (values.readinessProbe?.httpGet) {
    values.readinessProbe.httpGet.path = serviceType.defaultHealthPath;
  }

  // Apply service-specific config (excluding overrides)
  const { overrides, ...serviceConfigWithoutOverrides } = serviceConfig;
  log(`Applying service-specific configuration`, 'debug');
  values = deepMerge(
    values,
    serviceConfigWithoutOverrides as Partial<ServiceConfig>,
  );

  // Apply environment overrides
  const envOverrides = environmentOverrides[environment] ?? {};
  if (Object.keys(envOverrides).length > 0) {
    log(`Applying environment-specific overrides`, 'debug');
    values = deepMerge(values, envOverrides as Partial<ServiceConfig>);
  }

  // Apply service-specific environment overrides from service.yaml
  if (overrides?.[environment]) {
    log(`Applying service-specific overrides for ${environment}`, 'debug');
    values = deepMerge(
      values,
      overrides[environment] as Partial<ServiceConfig>,
    );
  }

  // Set NODE_ENV
  if (values.env) {
    values.env.NODE_ENV =
      environment === 'development' ? 'development' : 'production';
  }

  log(`Configuration merge completed`, 'debug');
  return values;
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'debug');
  }
}

function loadTemplate(): Handlebars.TemplateDelegate {
  const templatePath = path.join(__dirname, 'templates/values.hbs');
  log(`Loading template from: ${templatePath}`, 'debug');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(templateContent);
}

function writeValuesFile(
  serviceName: string,
  environment: string,
  values: ServiceConfig,
): void {
  const overridesDir = path.join(__dirname, '../../overrides', environment);
  ensureDirectoryExists(overridesDir);

  const outputPath = path.join(overridesDir, `${serviceName}.yaml`);

  const template = loadTemplate();

  const output = template({
    serviceName,
    environment,
    timestamp: new Date().toISOString(),
    ...values,
  });

  fs.writeFileSync(outputPath, output, 'utf-8');

  const relativePath = path.relative(process.cwd(), outputPath);
  log(`Generated: ${relativePath}`, 'success');
}

export function generateValuesForAllServices(): void {
  log('Starting values generation process', 'info');
  log('', 'info');

  const services = loadServices();
  const nestServices = services.nest || [];
  const nextServices = services.next || [];
  const allServices = [...nestServices, ...nextServices];

  log(`Found ${allServices.length} service(s) to process:`, 'info');
  for (const service of nestServices) {
    log(
      `  • ${service.name} (nest)${service.description ? ` - ${service.description}` : ''}`,
      'info',
    );
  }
  for (const service of nextServices) {
    log(
      `  • ${service.name} (next)${service.description ? ` - ${service.description}` : ''}`,
      'info',
    );
  }
  log('', 'info');

  let successCount = 0;
  let errorCount = 0;

  for (const service of allServices) {
    log(`Processing service: ${service.name}`, 'info');

    for (const environment of ENVIRONMENTS) {
      try {
        const values = generateValuesForService(service.name, environment);
        writeValuesFile(service.name, environment, values);
        successCount++;
      } catch (error) {
        log(
          `Error generating values for ${service.name} in ${environment}: ${error instanceof Error ? error.message : error}`,
          'error',
        );
        errorCount++;
      }
    }
    log('', 'info');
  }

  log('', 'info');
  log('Generation summary:', 'info');
  log(`  Total files generated: ${successCount}`, 'success');
  if (errorCount > 0) {
    log(`  Errors encountered: ${errorCount}`, 'error');
  }
}
