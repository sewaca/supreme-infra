import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import * as yaml from 'yaml';
import type { ServiceConfig, ServiceType } from './types';

const SERVICE_TYPES: Record<string, ServiceType> = {
  backend: { type: 'backend', defaultPort: 4000, defaultHealthPath: '/status' },
  frontend: { type: 'frontend', defaultPort: 3000, defaultHealthPath: '/api/status' },
};

const ENVIRONMENTS = ['development', 'staging', 'production'];

function log(message: string, level: 'info' | 'success' | 'error' | 'debug' = 'info'): void {
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
        result[key] = deepMerge(
          targetValue,
          sourceValue
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

function loadDefaultValues(): ServiceConfig {
  log('Loading default values from defaults.yaml', 'debug');
  const defaultsPath = path.join(__dirname, 'defaults.yaml');
  const content = fs.readFileSync(defaultsPath, 'utf-8');
  return yaml.parse(content) as ServiceConfig;
}

function loadEnvironmentOverrides(): Record<string, Partial<ServiceConfig>> {
  log('Loading environment overrides from environment-overrides.yaml', 'debug');
  const overridesPath = path.join(__dirname, 'environment-overrides.yaml');
  const content = fs.readFileSync(overridesPath, 'utf-8');
  return yaml.parse(content) as Record<string, Partial<ServiceConfig>>;
}

function detectServiceType(serviceName: string): ServiceType {
  log(`Detecting service type for: ${serviceName}`, 'debug');
  const servicesJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../generate-service/services.json'), 'utf-8')
  ) as Record<string, string[]>;
  
  for (const [type, services] of Object.entries(servicesJson)) {
    if (services.includes(serviceName)) {
      if (type === 'nest') {
        log(`Service type detected: backend (NestJS)`, 'debug');
        return SERVICE_TYPES.backend;
      }
      if (type === 'next') {
        log(`Service type detected: frontend (Next.js)`, 'debug');
        return SERVICE_TYPES.frontend;
      }
    }
  }
  
  log(`Service type not found, defaulting to: backend`, 'debug');
  return SERVICE_TYPES.backend;
}

function loadServiceConfig(serviceName: string): ServiceConfig {
  const serviceYamlPath = path.join(
    __dirname,
    '../../services',
    serviceName,
    'service.yaml'
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
  defaultValues: ServiceConfig,
  environmentOverrides: Record<string, Partial<ServiceConfig>>
): ServiceConfig {
  log(`Generating values for environment: ${environment}`, 'debug');
  
  const serviceType = detectServiceType(serviceName);
  const serviceConfig = loadServiceConfig(serviceName);
  
  log(`Merging configurations...`, 'debug');
  
  // Start with defaults
  let values: ServiceConfig = deepMerge({}, defaultValues);
  
  // Apply service type defaults
  log(`Applying service type defaults (port: ${serviceType.defaultPort})`, 'debug');
  if (!values.service) {
    values.service = {};
  }
  values.service.targetPort = serviceType.defaultPort;
  
  if (!values.env) {
    values.env = {};
  }
  values.env.PORT = serviceType.defaultPort.toString();
  
  // Update health check paths based on service type
  if (values.livenessProbe?.httpGet) {
    values.livenessProbe.httpGet.path = serviceType.defaultHealthPath;
  }
  if (values.readinessProbe?.httpGet) {
    values.readinessProbe.httpGet.path = serviceType.defaultHealthPath;
  }
  
  // Apply service-specific config (excluding overrides)
  const { overrides, ...serviceConfigWithoutOverrides } = serviceConfig;
  log(`Applying service-specific configuration`, 'debug');
  values = deepMerge(values, serviceConfigWithoutOverrides as Partial<ServiceConfig>);
  
  // Apply environment overrides
  const envOverrides = environmentOverrides[environment] ?? {};
  if (Object.keys(envOverrides).length > 0) {
    log(`Applying environment-specific overrides`, 'debug');
    values = deepMerge(values, envOverrides as Partial<ServiceConfig>);
  }
  
  // Apply service-specific environment overrides from service.yaml
  if (overrides?.[environment]) {
    log(`Applying service-specific overrides for ${environment}`, 'debug');
    values = deepMerge(values, overrides[environment] as Partial<ServiceConfig>);
  }
  
  // Set NODE_ENV
  if (values.env) {
    values.env.NODE_ENV = environment === 'development' ? 'development' : 'production';
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
  values: ServiceConfig
): void {
  const overridesDir = path.join(__dirname, '../overrides', environment);
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
  
  const servicesJson = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../generate-service/services.json'),
      'utf-8'
    )
  ) as Record<string, string[]>;
  
  const allServices = Object.values(servicesJson).flat();
  log(`Found ${allServices.length} service(s) to process: ${allServices.join(', ')}`, 'info');
  log('', 'info');
  
  // Load defaults and environment overrides once
  const defaultValues = loadDefaultValues();
  const environmentOverrides = loadEnvironmentOverrides();
  log('', 'info');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const serviceName of allServices) {
    log(`Processing service: ${serviceName}`, 'info');
    
    for (const environment of ENVIRONMENTS) {
      try {
        const values = generateValuesForService(
          serviceName,
          environment,
          defaultValues,
          environmentOverrides
        );
        writeValuesFile(serviceName, environment, values);
        successCount++;
      } catch (error) {
        log(
          `Error generating values for ${serviceName} in ${environment}: ${error instanceof Error ? error.message : error}`,
          'error'
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

