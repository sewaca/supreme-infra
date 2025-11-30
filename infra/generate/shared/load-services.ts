import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

export interface Service {
  name: string;
  description?: string;
}

export interface ServicesConfig {
  services: {
    nest: Service[];
    next: Service[];
  };
}

export function loadServices(): ServicesConfig['services'] {
  const servicesPath = path.join(__dirname, '../../../services.yaml');
  const content = fs.readFileSync(servicesPath, 'utf-8');
  const config = yaml.parse(content) as ServicesConfig;
  return config.services;
}

export function getServicesByType(type: 'nest' | 'next'): Service[] {
  const services = loadServices();
  return services[type] || [];
}

export function getAllServiceNames(): string[] {
  const services = loadServices();
  const nestServices = services.nest.map(s => s.name);
  const nextServices = services.next.map(s => s.name);
  return [...nestServices, ...nextServices];
}

export function getServiceByName(name: string): { service: Service; type: 'nest' | 'next' } | undefined {
  const services = loadServices();
  
  const nestService = services.nest.find(s => s.name === name);
  if (nestService) {
    return { service: nestService, type: 'nest' };
  }
  
  const nextService = services.next.find(s => s.name === name);
  if (nextService) {
    return { service: nextService, type: 'next' };
  }
  
  return undefined;
}
