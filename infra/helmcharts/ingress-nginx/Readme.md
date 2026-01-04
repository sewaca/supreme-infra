# Ingress NGINX Chart

This chart deploys the Ingress NGINX controller and automatically configures routing rules based on service router configurations.

## Overview

The ingress configuration is automatically generated from `services/*/router.yaml` files by running:

```bash
pnpm generate
```

This will:
1. Extract routes from NestJS and Next.js services
2. Generate `router.yaml` files for each service
3. Update `values.yaml` with ingress rules

## Manual Deployment

### Prerequisites

```bash
helm dependency build
```

### Install/Upgrade

```bash
helm upgrade ingress-nginx . -n ingress-nginx --install
```

## Automated Deployment

Use the GitHub workflow for production deployments:

```bash
gh workflow run deploy-ingress-nginx.yml
```

This will:
- Create a new version tag
- Deploy to Kubernetes cluster
- Create a GitHub release

## Configuration

The `values.yaml` file contains:
- **ingress-nginx**: Controller configuration (replicas, annotations)
- **ingress.rules**: Auto-generated routing rules for services

### Routing Rules

- **Backend (NestJS)**: `/api` → backend service (with rewrite)
- **Frontend (Next.js)**: `/` → frontend service (no rewrite)
