# Example Generated Ingress Manifests

This document shows examples of what Kubernetes Ingress manifests will be generated from the `values.yaml` file.

## Backend Service (NestJS)

For backend service with type `nest`, the ingress will be created with:

- Routes extracted from running dev server (includes global prefix)
- Regex support: enabled for dynamic parameters (`[^/]+`)
- No rewriting: paths forwarded as-is

Example routes from `services/backend/router.yaml`:

```yaml
- path: /api/api/status
  method: GET
- path: /api/auth/login
  method: POST
- path: /api/recipes/[^/]+
  method: GET
```

Generated Ingress paths:

```yaml
paths:
  - path: /api/api/status
    pathType: ImplementationSpecific
    backend:
      service:
        name: backend
        port:
          number: 80
  - path: /api/auth/login
    pathType: ImplementationSpecific
    backend:
      service:
        name: backend
        port:
          number: 80
  - path: /api/recipes/[^/]+
    pathType: ImplementationSpecific
    backend:
      service:
        name: backend
        port:
          number: 80
```

**Note**: Routes are extracted from the running NestJS application, so they automatically include any global prefixes set via `app.setGlobalPrefix('api')`:

- Request: `GET /api/auth/login`
- Forwarded to backend: `GET /api/auth/login`

## Frontend Service (Next.js)

For frontend service with type `next`, the ingress will be created with:

- No path prefix
- No rewrite
- Simple prefix matching

Example routes from `services/frontend/router.yaml`:

```yaml
- path: /
  method: GET
- path: /login
  method: GET
- path: /recipes/[^/]+
  method: GET
```

Generated Ingress paths:

```yaml
paths:
  - path: /
    pathType: Prefix
    backend:
      service:
        name: frontend
        port:
          number: 80
  - path: /login
    pathType: Prefix
    backend:
      service:
        name: frontend
        port:
          number: 80
  - path: /recipes/[^/]+
    pathType: Prefix
    backend:
      service:
        name: frontend
        port:
          number: 80
```

**Note**: No rewriting, requests are forwarded as-is:

- Request: `GET /login`
- Forwarded to frontend: `GET /login`

## Complete Example

Full generated manifest for backend service:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-main-backend
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /api/api/status
            pathType: ImplementationSpecific
            backend:
              service:
                name: backend
                port:
                  number: 80
          - path: /api/auth/login
            pathType: ImplementationSpecific
            backend:
              service:
                name: backend
                port:
                  number: 80
          - path: /api/recipes/[^/]+
            pathType: ImplementationSpecific
            backend:
              service:
                name: backend
                port:
                  number: 80
        # ... all other routes
```

## Routing Priority

Ingress NGINX processes routes in order, with more specific paths taking precedence:

1. **Backend routes** (with `/api` prefix) - processed first
2. **Frontend routes** (catch-all `/`) - processed last

This ensures:

- `/api/*` requests go to backend
- All other requests go to frontend
