# Secrets Management

This document describes how to manage secrets in the deployment pipeline.

## Overview

Sensitive configuration values like JWT secrets, API keys, and database passwords should never be committed to the repository. Instead, they are stored in GitHub Secrets and passed to the application during deployment.

This repository requires **10 secrets** to be configured in GitHub:

- **3 Infrastructure/CI/CD secrets** (PAT, Docker Hub credentials)
- **4 Yandex Cloud/Kubernetes secrets** (Cloud credentials and IDs)
- **1 Application secret** (JWT_SECRET for backend authentication)
- **2 TLS secrets** (Let's Encrypt certificate and private key for `diploma.sewaca.ru`)

### Secrets Quick Reference

| Secret Name            | Category    | Used By                             | Required |
| ---------------------- | ----------- | ----------------------------------- | -------- |
| PAT                    | CI/CD       | Pre-commit, Generate Infrastructure | ✅       |
| DOCKER_HUB_USERNAME    | CI/CD       | CD Pipeline (build & push)          | ✅       |
| DOCKER_HUB_TOKEN       | CI/CD       | CD Pipeline (build & push)          | ✅       |
| YC_SA_JSON_CREDENTIALS | Cloud       | CD Pipeline (deployment)            | ✅       |
| YC_CLOUD_ID            | Cloud       | CD Pipeline (deployment)            | ✅       |
| YC_FOLDER_ID           | Cloud       | CD Pipeline (deployment)            | ✅       |
| YC_K8S_CLUSTER_ID      | Cloud       | CD Pipeline (deployment)            | ✅       |
| JWT_SECRET             | Application | Backend service (runtime)           | ✅       |
| TLS_CERT               | TLS         | Deploy Ingress NGINX (TLS secret)   | ✅       |
| TLS_KEY                | TLS         | Deploy Ingress NGINX (TLS secret)   | ✅       |

## GitHub Secrets Configuration

### Required Secrets

The following secrets must be configured in your GitHub repository:

#### Infrastructure & CI/CD Secrets

1. **PAT** - GitHub personal access token
   - Used by: Madara Robot for automated operations (pre-commit fixes, service generation, etc.)
   - Format: `github_pat_XXX`
   - How to generate: GitHub Settings → Developer settings → Personal access tokens → Generate new token
   - Required permissions: `repo`, `workflow`

2. **DOCKER_HUB_USERNAME** - Docker Hub repository owner's username
   - Used by: CI/CD pipeline for Docker image authentication and repository naming
   - Format: Your Docker Hub username (e.g., `sewaca`)
   - Example: `DOCKER_HUB_USERNAME=xxxxxxxxx`

3. **DOCKER_HUB_TOKEN** - Docker Hub access token
   - Used by: CI/CD pipeline to push built images to Docker Hub registry
   - Format: Docker Hub access token with **write** permissions
   - How to generate: Docker Hub → Account Settings → Security → New Access Token
   - Example: `DOCKER_HUB_TOKEN=dckr_pat_xxxxxxxxxxx`

#### Yandex Cloud & Kubernetes Secrets

4. **YC_SA_JSON_CREDENTIALS** - Yandex Cloud service account JSON credentials
   - Used by: Kubernetes deployment workflows
   - Format: JSON string with service account credentials
   - How to generate:
     ```bash
     yc iam key create --service-account-name <sa-name> --output key.json
     cat key.json
     ```

5. **YC_CLOUD_ID** - Yandex Cloud ID
   - Used by: Yandex Cloud authentication
   - Format: Cloud identifier (e.g., `b1g2xxxxxxxxxxxxx`)
   - How to find: `yc config list` or Yandex Cloud Console

6. **YC_FOLDER_ID** - Yandex Cloud folder ID
   - Used by: Resource management in Yandex Cloud
   - Format: Folder identifier (e.g., `b1gxxxxxxxxxxxxx`)
   - How to find: `yc config list` or Yandex Cloud Console

7. **YC_K8S_CLUSTER_ID** - Kubernetes cluster ID in Yandex Cloud
   - Used by: Kubernetes cluster authentication and deployment
   - Format: Cluster identifier (e.g., `catxxxxxxxxxxxxx`)
   - How to find: `yc managed-kubernetes cluster list`

#### Application Secrets

8. **JWT_SECRET** - Secret key for JWT token signing and verification
   - Used by: `backend` service for authentication
   - Format: Secure random string (recommended: 32+ characters)
   - How to generate: `openssl rand -base64 32`
   - Example: `JWT_SECRET=your-secure-random-string`

#### TLS Secrets

9. **TLS_CERT** - Let's Encrypt TLS certificate for `diploma.sewaca.ru`
   - Used by: `deploy-ingress-nginx.yml` to create the `supreme-tls-cert` Kubernetes secret
   - Format: PEM-encoded certificate. Use **"Сертификат и цепочка сертификатов"** (certificate + chain) — preferred, ensures browsers build the full trust chain
   - How to obtain: Download from your Let's Encrypt provider (e.g. Certbot, ZeroSSL, etc.)
   - Value: Full contents of the `.crt` / `.pem` file (including `-----BEGIN CERTIFICATE-----` headers)

10. **TLS_KEY** - Private key for the Let's Encrypt certificate
    - Used by: `deploy-ingress-nginx.yml` to create the `supreme-tls-cert` Kubernetes secret
    - Format: PEM-encoded private key. Use **"Только приватный ключ"**
    - Value: Full contents of the `.key` file (including `-----BEGIN PRIVATE KEY-----` headers)

### How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret name and value
5. Click **Add secret**

### Quick Setup Checklist

Use this checklist to ensure all secrets are configured:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Check Yandex Cloud configuration
yc config list

# List Kubernetes clusters
yc managed-kubernetes cluster list

# Create service account key
yc iam key create --service-account-name <sa-name> --output key.json
```

**Required secrets checklist:**

- [ ] PAT (GitHub personal access token)
- [ ] DOCKER_HUB_USERNAME
- [ ] DOCKER_HUB_TOKEN
- [ ] YC_SA_JSON_CREDENTIALS
- [ ] YC_CLOUD_ID
- [ ] YC_FOLDER_ID
- [ ] YC_K8S_CLUSTER_ID
- [ ] JWT_SECRET
- [ ] TLS_CERT (Let's Encrypt certificate for diploma.sewaca.ru)
- [ ] TLS_KEY (Private key for diploma.sewaca.ru)

## Secrets Usage by Workflow

Different GitHub Actions workflows use different sets of secrets:

### CI Workflow (`.github/workflows/ci.yml`)

- No secrets required (runs tests and linting)

### Pre-commit Checks (`.github/workflows/precommit-checks.yml`)

- **PAT** - For committing automated fixes

### Generate Infrastructure (`.github/workflows/generate-infrastructure.yml`)

- **PAT** - For committing generated files

### CD Pipeline (`.github/workflows/cd.yml`)

- **DOCKER_HUB_USERNAME** - For Docker image naming and authentication
- **DOCKER_HUB_TOKEN** - For pushing images to Docker Hub
- **YC_SA_JSON_CREDENTIALS** - For Yandex Cloud authentication
- **YC_CLOUD_ID** - For Yandex Cloud operations
- **YC_FOLDER_ID** - For Yandex Cloud resource management
- **YC_K8S_CLUSTER_ID** - For Kubernetes cluster access
- **JWT_SECRET** - For backend service configuration

### Deploy Ingress NGINX (`.github/workflows/deploy-ingress-nginx.yml`)

- **YC_SA_JSON_CREDENTIALS** - For Yandex Cloud authentication
- **YC_CLOUD_ID** - For Yandex Cloud operations
- **YC_FOLDER_ID** - For Yandex Cloud resource management
- **YC_K8S_CLUSTER_ID** - For Kubernetes cluster access
- **TLS_CERT** - Let's Encrypt certificate applied to the `supreme-tls-cert` Kubernetes secret
- **TLS_KEY** - Private key applied to the `supreme-tls-cert` Kubernetes secret

## How It Works

### 1. Helm Chart Configuration

The backend Helm chart (`infra/helmcharts/backend-service`) supports a `secrets` value that creates a Kubernetes Secret:

```yaml
secrets:
  JWT_SECRET: "value-from-github-secrets"
```

### 2. Deployment Flow

1. **GitHub Actions Workflow** (`cd.yml`) passes secrets to the deploy action:

   ```yaml
   jwt-secret: ${{ secrets.JWT_SECRET }}
   ```

2. **Deploy Helm Action** receives the secret and passes it to Helm:

   ```bash
   helm upgrade ... --set secrets.JWT_SECRET=$JWT_SECRET
   ```

3. **Kubernetes Secret** is created by Helm template (`templates/secret.yaml`)

4. **Pod Environment Variables** are populated from the Kubernetes Secret:
   ```yaml
   env:
     - name: JWT_SECRET
       valueFrom:
         secretKeyRef:
           name: backend-secrets
           key: JWT_SECRET
   ```

### 3. Local Development

For local development, create a `.env.local` file in the service directory:

```bash
# services/backend/.env.local
JWT_SECRET="local-development-secret"
```

**Important:** `.env.local` is ignored by git and should never be committed.

## Adding New Secrets

To add a new secret to the backend service:

1. **Add to GitHub Secrets** (as described above)

2. **Update deploy-helm action** (`/.github/workflows/jobs/deploy-helm/action.yml`):

   ```yaml
   inputs:
     new-secret:
       description: "Description of the new secret"
       required: false
       default: ""
   ```

3. **Pass to Helm** in the action script:

   ```bash
   if [ -n "$NEW_SECRET" ]; then
     SECRETS_ARGS="$SECRETS_ARGS --set secrets.NEW_SECRET=$NEW_SECRET"
   fi
   ```

4. **Update CD workflow** (`.github/workflows/cd.yml`):

   ```yaml
   new-secret: ${{ secrets.NEW_SECRET }}
   ```

5. **Update local .env.example**:
   ```bash
   # services/backend/.env.example
   NEW_SECRET="example-value"
   ```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use strong random values** for secrets (e.g., `openssl rand -base64 32`)
3. **Rotate secrets regularly** (update in GitHub Secrets and redeploy)
4. **Use different secrets** for different environments (if you have staging/production)
5. **Limit access** to GitHub Secrets (only trusted maintainers)
6. **Audit secret usage** regularly

## Troubleshooting

### Secret not available in pod

Check if the Kubernetes Secret was created:

```bash
kubectl get secret backend-secrets -o yaml
```

Check if the pod has the environment variable:

```bash
kubectl exec -it <pod-name> -- env | grep JWT_SECRET
```

### Secret not updating after change

After updating a secret in GitHub:

1. Trigger a new deployment
2. Kubernetes will update the Secret
3. Pods need to be restarted to pick up the new value

Force pod restart:

```bash
kubectl rollout restart deployment backend
```

## References

- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Helm Secrets Management](https://helm.sh/docs/chart_best_practices/secrets/)
