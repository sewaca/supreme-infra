import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

export interface DatabaseConfig {
  enabled: boolean;
  name?: string;
  user?: string;
  passwordSecret?: string;
}

export interface Service {
  name: string;
  description?: string;
  database?: DatabaseConfig;
}

export type ServiceType = 'nest' | 'next' | 'fastapi';

export interface ServicesConfig {
  services: {
    nest: Service[];
    next: Service[];
    fastapi: Service[];
  };
}

export function loadServices(): ServicesConfig['services'] {
  const servicesPath = path.join(__dirname, '../../../services.yaml');
  const content = fs.readFileSync(servicesPath, 'utf-8');
  const config = yaml.parse(content) as ServicesConfig;
  return config.services;
}

export function getServicesByType(type: ServiceType): Service[] {
  const services = loadServices();
  return services[type] || [];
}

export function getAllServiceNames(): string[] {
  const services = loadServices();
  const nestServices = (services.nest || []).map((s) => s.name);
  const nextServices = (services.next || []).map((s) => s.name);
  const fastapiServices = (services.fastapi || []).map((s) => s.name);
  return [...nestServices, ...nextServices, ...fastapiServices];
}

export function getServiceByName(name: string): { service: Service; type: ServiceType } | undefined {
  const services = loadServices();

  const nestService = (services.nest || []).find((s) => s.name === name);
  if (nestService) {
    return { service: nestService, type: 'nest' };
  }

  const nextService = (services.next || []).find((s) => s.name === name);
  if (nextService) {
    return { service: nextService, type: 'next' };
  }

  const fastapiService = (services.fastapi || []).find((s) => s.name === name);
  if (fastapiService) {
    return { service: fastapiService, type: 'fastapi' };
  }

  return undefined;
}
