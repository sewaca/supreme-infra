import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

interface Route {
  path: string;
  method: string;
}

interface RouterConfig {
  service: string;
  type: 'nest' | 'next';
  routes: Route[];
}

interface IngressPath {
  path: string;
  method: string;
}

interface IngressRule {
  service: string;
  port: number;
  type: 'nest' | 'next';
  paths: IngressPath[];
}

interface IngressValues {
  'ingress-nginx': {
    controller: {
      replicaCount: number;
      allowSnippetAnnotations: boolean;
      config?: {
        'use-http2': string;
        'http2-max-field-size': string;
        'http2-max-header-size': string;
      };
    };
  };
  ingress: {
    enabled: boolean;
    name: string;
    namespace: string;
    rules: IngressRule[];
  };
}

function log(message: string, level: 'info' | 'success' | 'error' = 'info'): void {
  const prefix = { info: '→', success: '✓', error: '✗' };
  console.log(`${prefix[level]} ${message}`);
}

export function updateIngressValues(): void {
  log('Starting ingress values generation', 'info');

  const servicesDir = path.join(__dirname, '../../../services');
  const ingressValuesPath = path.join(__dirname, '../../../infra/helmcharts/ingress-nginx/values.yaml');

  const services = findServicesWithRouters(servicesDir);

  if (services.length === 0) {
    log('No services with router.yaml found', 'error');
    return;
  }

  log(`Found ${services.length} service(s) with routers`, 'info');

  const ingressRules = generateIngressRules(services);

  const ingressValues: IngressValues = {
    'ingress-nginx': {
      controller: {
        replicaCount: 2,
        allowSnippetAnnotations: true,
        config: {
          'use-http2': 'true',
          'http2-max-field-size': '16k',
          'http2-max-header-size': '32k',
        },
      },
    },
    ingress: {
      enabled: true,
      name: 'ingress-main',
      namespace: 'default',
      rules: ingressRules,
    },
  };

  const yamlContent = yaml.stringify(ingressValues, { indent: 2 });
  fs.writeFileSync(ingressValuesPath, yamlContent, 'utf-8');

  const relativePath = path.relative(process.cwd(), ingressValuesPath);
  log(`Generated: ${relativePath}`, 'success');
  log(`  Total ingress rules: ${ingressRules.length}`, 'info');
}

function findServicesWithRouters(servicesDir: string): RouterConfig[] {
  const services: RouterConfig[] = [];

  if (!fs.existsSync(servicesDir)) {
    return services;
  }

  const entries = fs.readdirSync(servicesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const routerPath = path.join(servicesDir, entry.name, 'router.yaml');

    if (fs.existsSync(routerPath)) {
      const content = fs.readFileSync(routerPath, 'utf-8');
      const routerConfig = yaml.parse(content) as RouterConfig;
      services.push(routerConfig);
    }
  }

  return services;
}

function generateIngressRules(services: RouterConfig[]): IngressRule[] {
  const rules: IngressRule[] = [];

  for (const service of services) {
    const paths: IngressPath[] = service.routes.map((route) => ({
      path: route.path,
      method: route.method,
    }));

    rules.push({
      service: service.service,
      port: 80,
      type: service.type,
      paths: paths,
    });
  }

  return rules;
}
