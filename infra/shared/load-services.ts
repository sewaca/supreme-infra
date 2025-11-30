import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

export interface Service {
  name: string;
  type: 'nest' | 'next';
  description?: string;
}

export interface ServicesConfig {
  services: Service[];
}

export function loadServices(): Service[] {
  const servicesPath = path.join(__dirname, '../services.yaml');
  const content = fs.readFileSync(servicesPath, 'utf-8');
  const config = yaml.parse(content) as ServicesConfig;
  return config.services;
}

export function getServicesByType(type: 'nest' | 'next'): Service[] {
  const services = loadServices();
  return services.filter(service => service.type === type);
}

export function getAllServiceNames(): string[] {
  const services = loadServices();
  return services.map(service => service.name);
}

export function getServiceByName(name: string): Service | undefined {
  const services = loadServices();
  return services.find(service => service.name === name);
}

