export interface DatabaseConfig {
  enabled: boolean;
  name?: string;
  user?: string;
  passwordSecret?: string;
}

export interface ServiceWithDatabase {
  name: string;
  description?: string;
  database?: DatabaseConfig;
}

export interface PgBouncerValues {
  nameOverride: string;
  fullnameOverride: string;
  image: {
    repository: string;
    tag: string;
    pullPolicy: string;
  };
  service: {
    type: string;
    port: number;
  };
  pgbouncer: {
    poolMode: string;
    maxClientConn: number;
    defaultPoolSize: number;
    minPoolSize: number;
    reservePoolSize: number;
    listenPort: number;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
  };
  resources: {
    limits: {
      cpu: string;
      memory: string;
    };
    requests: {
      cpu: string;
      memory: string;
    };
  };
}

export interface BaseChartValues {
  nameOverride?: string;
  fullnameOverride?: string;
  image?: {
    repository?: string;
    tag?: string;
    pullPolicy?: string;
  };
  service?: {
    type?: string;
    port?: number;
  };
  pgbouncer?: {
    poolMode?: string;
    maxClientConn?: number;
    defaultPoolSize?: number;
    minPoolSize?: number;
    reservePoolSize?: number;
    listenPort?: number;
  };
  database?: {
    host?: string;
    port?: number;
    name?: string;
    user?: string;
  };
  resources?: {
    limits?: {
      cpu?: string;
      memory?: string;
    };
    requests?: {
      cpu?: string;
      memory?: string;
    };
  };
  overrides?: {
    development?: Record<string, unknown>;
    production?: Record<string, unknown>;
  };
  [key: string]: unknown;
}
