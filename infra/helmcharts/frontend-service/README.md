# Frontend Service Helm Chart

Universal Helm chart for deploying Next.js frontend applications to Kubernetes.

## Overview

This Helm chart provides a standardized way to deploy Next.js frontend services with:

- Kubernetes Deployment with configurable replicas
- ClusterIP Service for internal communication
- Horizontal Pod Autoscaler (HPA) support
- Configurable resource limits and requests
- Health checks (liveness and readiness probes)
- Environment variable configuration

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Next.js application built and containerized

## Installation

### Basic Installation

```bash
helm install <release-name> ./infra/helmcharts/frontend-service \
  -f services/<service-name>/service.yaml \
  --set image.tag=<version>
```

### Example for frontend service

```bash
helm install frontend ./infra/helmcharts/frontend-service \
  -f services/frontend/service.yaml \
  --set image.tag=1.0.0
```

## Configuration

### Service-Specific Configuration

Each frontend service should have its own configuration file at `services/<service-name>/service.yaml`. This file contains service-specific overrides for the default values.

Example `services/frontend/service.yaml`:

```yaml
image:
  repository: frontend

nameOverride: 'frontend'
fullnameOverride: 'frontend'

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

env:
  PORT: '3000'
  NODE_ENV: 'production'

replicaCount: 2

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Values

| Parameter                                       | Description                              | Default                                |
| ----------------------------------------------- | ---------------------------------------- | -------------------------------------- |
| `replicaCount`                                  | Number of replicas                       | `2`                                    |
| `image.repository`                              | Container image repository               | `""`                                   |
| `image.tag`                                     | Container image tag                      | `""`                                   |
| `image.pullPolicy`                              | Image pull policy                        | `IfNotPresent`                         |
| `nameOverride`                                  | Override chart name                      | `""`                                   |
| `fullnameOverride`                              | Override full name                       | `""`                                   |
| `service.type`                                  | Kubernetes service type                  | `ClusterIP`                            |
| `service.port`                                  | Service port                             | `80`                                   |
| `service.targetPort`                            | Container target port                    | `3000`                                 |
| `env`                                           | Environment variables as key-value pairs | `PORT: "3000", NODE_ENV: "production"` |
| `resources.limits.cpu`                          | CPU limit                                | `500m`                                 |
| `resources.limits.memory`                       | Memory limit                             | `512Mi`                                |
| `resources.requests.cpu`                        | CPU request                              | `100m`                                 |
| `resources.requests.memory`                     | Memory request                           | `128Mi`                                |
| `livenessProbe`                                 | Liveness probe configuration             | See values.yaml                        |
| `readinessProbe`                                | Readiness probe configuration            | See values.yaml                        |
| `autoscaling.enabled`                           | Enable HPA                               | `false`                                |
| `autoscaling.minReplicas`                       | Minimum replicas                         | `2`                                    |
| `autoscaling.maxReplicas`                       | Maximum replicas                         | `10`                                   |
| `autoscaling.targetCPUUtilizationPercentage`    | Target CPU utilization                   | `80`                                   |
| `autoscaling.targetMemoryUtilizationPercentage` | Target memory utilization                | `80`                                   |
| `nodeSelector`                                  | Node selector labels                     | `{}`                                   |
| `tolerations`                                   | Tolerations                              | `[]`                                   |
| `affinity`                                      | Affinity rules                           | `{}`                                   |

## Usage in CI/CD

This chart is designed to be used in CI/CD pipelines where the image tag is provided dynamically:

```bash
helm upgrade --install frontend ./infra/helmcharts/frontend-service \
  -f services/frontend/service.yaml \
  --set image.tag=${CI_COMMIT_SHA}
```

## Health Checks

The chart includes default health checks for Next.js applications:

- **Liveness Probe**: Checks if the application is running (GET /)
  - Initial delay: 30 seconds
  - Period: 10 seconds
  - Timeout: 5 seconds
  - Failure threshold: 3

- **Readiness Probe**: Checks if the application is ready to serve traffic (GET /)
  - Initial delay: 10 seconds
  - Period: 5 seconds
  - Timeout: 3 seconds
  - Failure threshold: 3

## Autoscaling

The chart supports Horizontal Pod Autoscaling (HPA) with advanced scaling behavior:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 2
          periodSeconds: 30
      selectPolicy: Max
```

## Environment Variables

You can add custom environment variables through the `env` section:

```yaml
env:
  PORT: '3000'
  NODE_ENV: 'production'
  NEXT_PUBLIC_API_URL: 'https://api.example.com'
  CUSTOM_VAR: 'custom-value'
```

## Uninstallation

```bash
helm uninstall <release-name>
```

## Support

For issues or questions, please refer to the project documentation or contact the DevOps team.
