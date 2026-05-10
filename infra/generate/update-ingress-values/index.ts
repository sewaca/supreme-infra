import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

interface Route {
  path: string;
  method: string;
  /** Открыт ли маршрут снаружи через ingress. По умолчанию: true */
  public?: boolean;
}

interface RouterConfig {
  service: string;
  type: 'nest' | 'next' | 'fastapi';
  routes: Route[];
}

interface IngressPath {
  path: string;
  method: string;
}

interface IngressRule {
  service: string;
  port: number;
  type: 'nest' | 'next' | 'fastapi';
  paths: IngressPath[];
  /** Не перезаписываются при generate — только из существующего values.yaml */
  extraAnnotations?: Record<string, string>;
  /** Переопределяет глобальный rateLimit для этого сервиса. Сохраняется при generate. */
  rateLimit?: RateLimit;
}

interface RateLimit {
  rps?: number;
  connections?: number;
  burstMultiplier?: number;
  whitelist?: string;
}

interface IngressValues {
  'ingress-nginx'?: {
    controller?: {
      replicaCount?: number;
      allowSnippetAnnotations?: boolean;
      config?: {
        'use-http2'?: string;
        'http2-max-field-size'?: string;
        'http2-max-header-size'?: string;
        'limit-req-status-code'?: string;
      };
    };
  };
  ingress?: {
    enabled?: boolean;
    name?: string;
    namespace?: string;
    rateLimit?: RateLimit;
    tls?: {
      enabled?: boolean;
      secretName?: string;
      hosts?: string[];
    };
    rules?: IngressRule[];
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

  let existingValues: IngressValues = {};

  if (fs.existsSync(ingressValuesPath)) {
    const existingContent = fs.readFileSync(ingressValuesPath, 'utf-8');
    existingValues = yaml.parse(existingContent) as IngressValues;
    log('Loaded existing values.yaml', 'info');
  }

  const ingressRules = generateIngressRules(services);
  const mergedRules = mergeIngressRulesWithExisting(ingressRules, existingValues.ingress?.rules, services);

  // Merge with defaults, preserving all existing values
  const ingressValues: IngressValues = {
    'ingress-nginx': existingValues['ingress-nginx'] || {
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
      ...existingValues.ingress,
      enabled: existingValues.ingress?.enabled ?? true,
      name: existingValues.ingress?.name ?? 'ingress-main',
      namespace: existingValues.ingress?.namespace ?? 'default',
      rules: mergedRules,
    },
  };

  const yamlContent = yaml.stringify(ingressValues, { indent: 2 });
  fs.writeFileSync(ingressValuesPath, yamlContent, 'utf-8');

  const relativePath = path.relative(process.cwd(), ingressValuesPath);
  log(`Generated: ${relativePath}`, 'success');
  log(`  Total ingress rules: ${mergedRules.length}`, 'info');
  log('  Preserved manual ingress paths & extraAnnotations per service', 'success');
}

function ingressPathKey(p: IngressPath): string {
  return `${p.path}::${p.method}`;
}

/**
 * Сохраняет пути и extraAnnotations из values.yaml, которых нет в router.yaml (например /core-messages/ws).
 * Также сохраняет правила для сервисов, у которых нет router.yaml (например minio).
 * Пути с public: false в router.yaml не восстанавливаются из старого values.yaml.
 */
function mergeIngressRulesWithExisting(
  generated: IngressRule[],
  existing: IngressRule[] | undefined,
  services: RouterConfig[],
): IngressRule[] {
  if (!existing?.length) return generated;

  const generatedServices = new Set(generated.map((r) => r.service));
  // Сервисы, у которых есть router.yaml (даже если все роуты private)
  const routerServices = new Set(services.map((s) => s.service));

  // Явно приватные пути по сервисам (public: false в router.yaml)
  const privatePathsByService = new Map<string, Set<string>>();
  for (const svc of services) {
    const privatePaths = new Set<string>();
    if (!svc.routes) continue;
    for (const route of svc.routes ?? []) {
      if (route.public === false) {
        privatePaths.add(ingressPathKey({ path: route.path, method: route.method }));
      }
    }
    if (privatePaths.size > 0) {
      privatePathsByService.set(svc.service, privatePaths);
    }
  }

  const merged = generated.map((rule) => {
    const prev = existing.find((e) => e.service === rule.service);
    if (!prev) return rule;

    const privatePaths = privatePathsByService.get(rule.service) ?? new Set<string>();
    const seen = new Set(rule.paths.map(ingressPathKey));
    const mergedPaths = [...rule.paths];
    for (const p of prev.paths ?? []) {
      const k = ingressPathKey(p);
      // Не восстанавливаем путь если он явно помечен public: false
      if (!seen.has(k) && !privatePaths.has(k)) {
        mergedPaths.push(p);
        seen.add(k);
      }
    }

    return {
      ...rule,
      paths: mergedPaths,
      ...(prev.extraAnnotations ? { extraAnnotations: prev.extraAnnotations } : {}),
      ...(prev.rateLimit ? { rateLimit: prev.rateLimit } : {}),
    };
  });

  // Сохраняем правила только для сервисов, у которых нет router.yaml (например minio)
  for (const rule of existing) {
    if (!generatedServices.has(rule.service) && !routerServices.has(rule.service)) {
      merged.push(rule);
    }
  }

  return merged;
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
    if (!service?.routes) {
      continue;
    }

    const paths: IngressPath[] = service.routes
      .filter((route) => route.public !== false)
      .map((route) => ({
        path: route.path,
        method: route.method,
      }));

    if (paths.length === 0) {
      continue;
    }

    rules.push({
      service: service.service,
      port: 80,
      type: service.type,
      paths: paths,
    });
  }

  return rules;
}
