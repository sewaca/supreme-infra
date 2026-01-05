# Release Pipeline & Helm Charts

## Overview

This document describes how releases, rollbacks, and Helm deployments work in supreme-infra.

## Directory Structure

```
.github/workflows/
├── cd.yml                              # Main release pipeline
├── jobs/
│   ├── setup-yandex-cloud/action.yml   # YC CLI + kubectl setup
│   ├── install-github-cli/action.yml   # GitHub CLI installation
│   ├── deploy-helm/action.yml          # Helm deployment action
│   ├── nest-application-security-check/
│   └── next-application-security-check/

infra/
├── helmcharts/
│   ├── backend-service/                # Helm chart for NestJS services
│   │   ├── templates/
│   │   │   ├── deployment.yaml         # Main deployment
│   │   │   ├── canary-deployment.yaml  # Canary deployment (conditional)
│   │   │   ├── service.yaml            # K8s Service
│   │   │   ├── hpa.yaml                # Horizontal Pod Autoscaler
│   │   │   └── _helpers.tpl            # Template helpers
│   │   └── values.yaml
│   └── frontend-service/               # Helm chart for Next.js services
│       └── (same structure)
├── overrides/
│   ├── production/
│   │   ├── backend.yaml                # Production overrides for backend
│   │   └── frontend.yaml               # Production overrides for frontend
│   └── development/
│       └── ...
```

## Service Configuration

Services are defined in `services.yaml` at the root:

```yaml
services:
  nest:
    - name: backend
      # ...
  next:
    - name: frontend
      # ...
```

Each service has its own `service.yaml` in `services/{name}/service.yaml` that defines deployment parameters.

## Release Flow (Normal)

1. **detect-release-mode** - Checks if this is a rollback or normal release
2. **prepare-services** - Reads `services.yaml`, determines service type (nest/next)
3. **get-latest-release-version** - Finds latest GitHub release tag for the service
4. **calculate-new-version** - Analyzes commits to determine version bump:
   - `major:` prefix → major version bump
   - `minor:` prefix → minor version bump
   - `fix:` prefix → patch version bump
   - `chore:` only → rollback release (same version + hash)
5. **security-checks** - Runs security scans
6. **build-image-to-docker-hub** - Builds and pushes Docker image
7. **create-release-branch** - Creates `releases/production/{service}-{version}` branch
8. **create-github-release** - Creates GitHub release with changelog
9. **deploy-canary** - Deploys canary pods (50% of current replicas)
10. **approve-canary** - Waits for manual approval in `production` environment
11. **promote-to-production** - Updates main deployment, removes canary

## Rollback Flow

Triggered when `release_branch` input is provided (e.g., `releases/production/frontend-3.1.5`).

1. **detect-release-mode** - Detects rollback mode, extracts version from branch name
2. **validate-rollback** - Checks branch exists and Docker image exists
3. **rebase-rollback-branch** - Rebases rollback branch onto main (to get fresh helm overrides)
4. **create-rollback-release** - Creates GitHub release "Rollback {service} to v{version}"
5. **deploy-rollback-canary** - Deploys canary with old version
6. **approve-rollback-canary** - Manual approval
7. **promote-rollback-to-production** - Final deployment

## Helm Charts

### Values Structure

```yaml
image:
  repository: ''
  tag: ''
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 4000 # 3000 for frontend

env:
  PORT: '4000'
  NODE_ENV: 'production'

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: false
  minReplicas: 2
  maxReplicas: 10

canary:
  enabled: false
  replicas: 1
  image:
    repository: ''
    tag: ''
```

### Canary Deployment

When `canary.enabled=true`:

- Creates separate Deployment `{service}-canary`
- Canary pods have label `app.kubernetes.io/variant: canary`
- Canary pods have env `CANARY=true`
- Service routes traffic to BOTH stable and canary pods (same selector labels)
- Traffic split is roughly proportional to pod count (50% if equal replicas)

### Key Helm Commands

```bash
# Deploy with canary
helm upgrade $SERVICE $CHART_PATH \
  -f $OVERRIDES_FILE \
  --set canary.enabled=true \
  --set canary.replicas=2 \
  --set canary.image.tag="production-backend-v1.2.3" \
  --install --wait --timeout 5m

# Promote to production (disable canary)
helm upgrade $SERVICE $CHART_PATH \
  -f $OVERRIDES_FILE \
  --set image.tag="production-backend-v1.2.3" \
  --set canary.enabled=false \
  --install --wait --timeout 5m --atomic
```

## Docker Image Naming

Format: `{DOCKER_HUB_USERNAME}/supreme:production-{service}-v{version}`

Example: `sewaca/supreme:production-backend-v1.2.3`

## GitHub Environments

Required environments with protection rules:

- **canary** - For canary deployments (can be auto-approved)
- **production** - Requires manual approval for promotion

## Composite Actions

### setup-yandex-cloud

Installs YC CLI, configures credentials, gets kubectl config for K8s cluster.

Inputs:

- `yc-sa-json-credentials`
- `yc-cloud-id`
- `yc-folder-id`
- `yc-k8s-cluster-id`

### deploy-helm

Deploys service using Helm.

Inputs:

- `service-name`
- `service-type` (nest/next)
- `version`
- `docker-hub-username`
- `canary-enabled` (default: false)
- `canary-replicas` (default: 1)
- `atomic` (default: false)

### install-github-cli

Installs GitHub CLI on Ubuntu runner.

## Secrets Required

- `DOCKER_HUB_USERNAME` - Docker Hub username
- `DOCKER_HUB_TOKEN` - Docker Hub access token
- `YC_SA_JSON_CREDENTIALS` - Yandex Cloud service account JSON
- `YC_CLOUD_ID` - Yandex Cloud ID
- `YC_FOLDER_ID` - Yandex Cloud folder ID
- `YC_K8S_CLUSTER_ID` - Kubernetes cluster ID

## Version Tagging

- Normal release: `{service}-v{version}` (e.g., `backend-v1.2.3`)
- Chore release: `{service}-v{version}-{hash}` (e.g., `backend-v1.2.3-abc12345`)
- Rollback: `{service}-rollback-v{version}-{short-sha}` (e.g., `backend-rollback-v1.2.3-def456`)

## Branch Naming

Release branches: `releases/production/{service}-{version}`

Example: `releases/production/frontend-3.1.5`

## Troubleshooting

### Canary pods not receiving traffic

Check that Service selector matches both stable and canary pods:

```bash
kubectl get svc $SERVICE -o yaml
kubectl get pods -l app.kubernetes.io/name=$SERVICE --show-labels
```

### Rollback fails - image not found

Ensure the Docker image for the target version exists in Docker Hub.
Check: `https://hub.docker.com/r/{username}/supreme/tags`

### Helm deployment stuck

Check pod status and events:

```bash
kubectl get pods -l app.kubernetes.io/name=$SERVICE
kubectl describe pod $POD_NAME
kubectl logs $POD_NAME
```
