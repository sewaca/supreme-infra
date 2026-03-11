# PostgreSQL Helm Chart

This Helm chart deploys a PostgreSQL database for the authentication service.

## Features

- StatefulSet for persistent data storage
- Configurable resources and persistence
- Environment-specific overrides
- Secure secret management
- Health checks (liveness and readiness probes)
- Initial setup script (`init.sql`) for first-time database creation
- Migration system for applying updates on every upgrade

## Configuration

### Database Settings

```yaml
database:
  name: auth_db
  user: auth_user
  password: <set-via-secret>
```

### Persistence

```yaml
persistence:
  enabled: true
  storageClass: ""
  size: 10Gi
  accessMode: ReadWriteOnce
```

### Resources

```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi
```

## Installation

### Development

```bash
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password=dev_password
```

### Production

```bash
helm install postgresql ./infra/helmcharts/postgresql \
  --namespace production \
  --set database.password=$DB_PASSWORD \
  -f infra/helmcharts/postgresql/environment-overrides.yaml
```

## Accessing the Database

From within the cluster:

```
Host: postgresql.default.svc.cluster.local
Port: 5432
Database: auth_db
User: auth_user
Password: <from-secret>
```

## Backup and Restore

### Backup

```bash
kubectl exec -it postgresql-0 -- pg_dump -U auth_user auth_db > backup.sql
```

### Restore

```bash
kubectl exec -i postgresql-0 -- psql -U auth_user auth_db < backup.sql
```

## Monitoring

The database includes health checks:

- Liveness probe: Checks if PostgreSQL is running
- Readiness probe: Checks if PostgreSQL is ready to accept connections

## Database Initialization and Migrations

### Initial Setup (`init.sql`)

The `init.sql` script runs only once when the database is first created. It should contain:

- Schema creation (tables, indexes, constraints)
- Initial data that is required for the database to function

### Migrations (`migrations/*.sql`)

Migrations run on every `helm upgrade` via a Kubernetes Job with `post-upgrade` hook. They should contain:

- Data updates
- Schema modifications
- Test data insertions

**Migration naming convention:**

```
XXX_description.sql
```

Example: `001_initial_user.sql`, `002_add_phone_column.sql`

**Important:** Migrations must be idempotent (safe to run multiple times). Use:

- `ON CONFLICT DO NOTHING` for INSERT
- `IF NOT EXISTS` for CREATE
- `IF EXISTS` for DROP

See `infra/databases/{service}-db/migrations/README.md` for more details.

## Security

- Passwords are stored in Kubernetes secrets
- Non-root user execution
- Resource limits to prevent resource exhaustion
