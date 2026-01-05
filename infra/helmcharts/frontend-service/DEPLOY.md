# Frontend Service Deployment Guide

This guide provides step-by-step instructions for deploying Next.js frontend services using this Helm chart.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Deployment Scenarios](#deployment-scenarios)
4. [CI/CD Integration](#cicd-integration)
5. [Troubleshooting](#troubleshooting)
6. [Rollback](#rollback)

## Prerequisites

### Required Tools

- `kubectl` configured with access to your Kubernetes cluster
- `helm` 3.0 or higher
- Docker image of your Next.js application pushed to a registry

### Cluster Requirements

- Kubernetes 1.19+
- Metrics Server installed (for HPA)
- Sufficient resources available in the cluster

## Quick Start

### 1. Create Service Configuration

Create a configuration file for your service at `services/<service-name>/service.yaml`:

```yaml
image:
  repository: your-registry/frontend

nameOverride: 'frontend'
fullnameOverride: 'frontend'

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

env:
  PORT: '3000'
  NODE_ENV: 'production'
  NEXT_PUBLIC_API_URL: 'https://api.example.com'

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
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### 2. Deploy the Service

```bash
helm install frontend ./infra/helmcharts/frontend-service \
  -f services/frontend/service.yaml \
  --set image.tag=1.0.0 \
  --namespace default
```

### 3. Verify Deployment

```bash
# Check deployment status
kubectl get deployments

# Check pods
kubectl get pods

# Check service
kubectl get services

# Check HPA (if enabled)
kubectl get hpa
```

## Deployment Scenarios

### Development Environment

For development, you might want lower resource limits and no autoscaling:

```bash
helm install frontend-dev ./infra/helmcharts/frontend-service \
  -f services/frontend/service.yaml \
  --set image.tag=dev-latest \
  --set replicaCount=1 \
  --set autoscaling.enabled=false \
  --set resources.limits.cpu=200m \
  --set resources.limits.memory=256Mi \
  --namespace development
```

### Staging Environment

```bash
helm install frontend-staging ./infra/helmcharts/frontend-service \
  -f services/frontend/service.yaml \
  --set image.tag=staging-${VERSION} \
  --set env.NEXT_PUBLIC_API_URL=https://api-staging.example.com \
  --namespace staging
```

### Production Environment

```bash
helm install frontend-prod ./infra/helmcharts/frontend-service \
  -f services/frontend/service.yaml \
  --set image.tag=${VERSION} \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=3 \
  --set autoscaling.maxReplicas=20 \
  --namespace production
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
    paths:
      - 'services/frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: services/frontend/Dockerfile
          push: true
          tags: your-registry/frontend:${{ github.sha }}

      - name: Install Helm
        uses: azure/setup-helm@v3

      - name: Deploy to Kubernetes
        run: |
          helm upgrade --install frontend ./infra/helmcharts/frontend-service \
            -f services/frontend/service.yaml \
            --set image.tag=${{ github.sha }} \
            --namespace production
```

### GitLab CI Example

```yaml
deploy:frontend:
  stage: deploy
  image: alpine/helm:latest
  script:
    - helm upgrade --install frontend ./infra/helmcharts/frontend-service
      -f services/frontend/service.yaml
      --set image.tag=${CI_COMMIT_SHA}
      --namespace production
  only:
    - main
  environment:
    name: production
```

## Troubleshooting

### Pods Not Starting

Check pod logs:

```bash
kubectl logs -l app.kubernetes.io/name=frontend
```

Check pod events:

```bash
kubectl describe pod -l app.kubernetes.io/name=frontend
```

### Service Not Accessible

Check service endpoints:

```bash
kubectl get endpoints frontend
```

Check if pods are ready:

```bash
kubectl get pods -l app.kubernetes.io/name=frontend
```

### HPA Not Scaling

Check HPA status:

```bash
kubectl describe hpa frontend
```

Verify metrics server is running:

```bash
kubectl get pods -n kube-system | grep metrics-server
```

### Image Pull Errors

Check image pull secrets:

```bash
kubectl get secrets
```

Verify image repository and tag:

```bash
kubectl describe pod <pod-name> | grep Image
```

## Rollback

### Rollback to Previous Version

```bash
helm rollback frontend
```

### Rollback to Specific Revision

```bash
# List revisions
helm history frontend

# Rollback to specific revision
helm rollback frontend <revision-number>
```

### Emergency Rollback with Image Tag

```bash
helm upgrade frontend ./infra/helmcharts/frontend-service \
  -f services/frontend/service.yaml \
  --set image.tag=<previous-working-tag>
```

## Monitoring

### View Logs

```bash
# All pods
kubectl logs -l app.kubernetes.io/name=frontend --tail=100 -f

# Specific pod
kubectl logs <pod-name> --tail=100 -f
```

### Check Resource Usage

```bash
kubectl top pods -l app.kubernetes.io/name=frontend
```

### Check HPA Metrics

```bash
kubectl get hpa frontend --watch
```

## Cleanup

### Uninstall Release

```bash
helm uninstall frontend
```

### Delete Namespace (if needed)

```bash
kubectl delete namespace <namespace-name>
```

## Best Practices

1. **Always specify image tags**: Never use `latest` in production
2. **Use resource limits**: Prevent pods from consuming excessive resources
3. **Enable autoscaling in production**: Handle traffic spikes automatically
4. **Configure health checks**: Ensure proper traffic routing
5. **Use namespaces**: Separate environments logically
6. **Version your deployments**: Tag images with commit SHA or version numbers
7. **Test in staging first**: Validate changes before production deployment
8. **Monitor deployments**: Watch logs and metrics during rollout
9. **Have a rollback plan**: Know how to quickly revert changes
10. **Document environment variables**: Keep track of configuration differences

## Support

For additional help or questions:

- Check the main README.md
- Review Kubernetes documentation
- Contact the DevOps team
