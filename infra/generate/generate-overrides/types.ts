export interface ServiceConfig {
  image?: {
    repository?: string;
    tag?: string;
    pullPolicy?: string;
  };
  nameOverride?: string;
  fullnameOverride?: string;
  service?: {
    type?: string;
    port?: number;
    targetPort?: number;
  };
  env?: Record<string, string>;
  replicaCount?: number;
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
  livenessProbe?: {
    httpGet?: {
      path?: string;
      port?: string;
    };
    initialDelaySeconds?: number;
    periodSeconds?: number;
    timeoutSeconds?: number;
    failureThreshold?: number;
  };
  readinessProbe?: {
    httpGet?: {
      path?: string;
      port?: string;
    };
    initialDelaySeconds?: number;
    periodSeconds?: number;
    timeoutSeconds?: number;
    failureThreshold?: number;
  };
  nodeSelector?: Record<string, string>;
  tolerations?: unknown[];
  affinity?: Record<string, unknown>;
  autoscaling?: {
    enabled?: boolean;
    minReplicas?: number;
    maxReplicas?: number;
    targetCPUUtilizationPercentage?: number;
    targetMemoryUtilizationPercentage?: number;
    behavior?: {
      scaleDown?: {
        stabilizationWindowSeconds?: number;
        policies?: Array<{
          type?: string;
          value?: number;
          periodSeconds?: number;
        }>;
      };
      scaleUp?: {
        stabilizationWindowSeconds?: number;
        policies?: Array<{
          type?: string;
          value?: number;
          periodSeconds?: number;
        }>;
        selectPolicy?: string;
      };
    };
  };
  overrides?: Record<string, Partial<ServiceConfig>>;
}

export interface ServiceType {
  type: 'backend' | 'frontend';
  defaultPort: number;
  defaultHealthPath: string;
}
