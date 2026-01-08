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

export interface DatabaseValues {
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
  persistence: {
    enabled: boolean;
    storageClass: string;
    size: string;
    accessMode: string;
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
  database: {
    name: string;
    user: string;
  };
  securityContext: {
    runAsUser: number;
    runAsGroup: number;
    fsGroup: number;
  };
}

export interface EnvironmentOverrides {
  development: {
    persistence: {
      size: string;
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
  };
  production: {
    persistence: {
      size: string;
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
  };
}
