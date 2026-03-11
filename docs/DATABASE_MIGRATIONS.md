# Database Migrations System

This document describes the database initialization and migration system used in the supreme-infra project.

## Overview

The system consists of two parts:

1. **Initial Setup** (`init.sql`) - Runs once when database is first created
2. **Migrations** (`migrations/*.sql`) - Run on every `helm upgrade`

## Directory Structure

```
infra/databases/
└── {service}-db/
    ├── init.sql          # Initial schema and setup (runs once)
    ├── service.yaml      # Database configuration
    └── migrations/       # Migration files (run on upgrade)
        ├── README.md
        ├── 001_initial_user.sql
        ├── 002_add_column.sql
        └── ...
```

## Initial Setup (`init.sql`)

The `init.sql` script runs only once when the PostgreSQL container is first created. It should contain:

- `CREATE TABLE` statements
- `CREATE INDEX` statements
- Schema setup
- Essential initial data

**Example:**

```sql
CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
```

## Migrations (`migrations/*.sql`)

Migrations run on every `helm upgrade` via a Kubernetes Job with `post-upgrade` hook.

### Naming Convention

```
XXX_description.sql
```

- `XXX`: 3-digit number (001, 002, 003, etc.)
- `description`: Brief description using snake_case

**Examples:**

- `001_initial_user.sql` - Create test user
- `002_add_phone_column.sql` - Add phone column to user table
- `003_update_test_data.sql` - Update existing test data

### Writing Migrations

**Golden Rule:** Migrations must be **idempotent** (safe to run multiple times).

**Use these patterns:**

```sql
-- For INSERT
INSERT INTO "user" (id, name, email)
VALUES ('uuid', 'John', 'john@example.com')
ON CONFLICT (id) DO NOTHING;

-- For CREATE TABLE
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY
);

-- For ALTER TABLE (add column)
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS phone VARCHAR;

-- For CREATE INDEX
CREATE INDEX IF NOT EXISTS idx_user_phone ON "user"(phone);

-- For DROP (be careful!)
DROP TABLE IF EXISTS old_table;
```

### Migration Execution

Migrations are executed automatically during `helm upgrade`:

1. Helm upgrade starts
2. PostgreSQL StatefulSet is updated (if needed)
3. `post-upgrade` hook triggers migration Job
4. Job runs all migrations in alphabetical order
5. If any migration fails, the upgrade is marked as failed

**View migration logs:**

```bash
kubectl logs -n supreme-infra -l app=postgresql-{service}-migration --tail=100
```

## Workflow

### Adding a New Migration

1. Create migration file:

```bash
# Example for core-client-info
cd infra/databases/core-client-info-db/migrations
touch 002_add_phone_column.sql
```

2. Write idempotent SQL:

```sql
-- Migration: Add phone column to user table
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS phone VARCHAR;
```

3. Regenerate database values:

```bash
pnpm run generate
```

This will update `infra/overrides/{env}/postgresql-{service}.yaml` with the new migration.

4. Commit and push:

```bash
git add .
git commit -m "feat: add phone column migration"
git push
```

5. Deploy via GitHub Actions or manually:

```bash
helm upgrade postgresql-core-client-info ./infra/helmcharts/postgresql \
  --namespace supreme-infra \
  -f infra/overrides/production/postgresql-core-client-info.yaml \
  --set database.password="$DB_PASSWORD"
```

## Troubleshooting

### Migration Job Failed

Check logs:

```bash
kubectl logs -n supreme-infra -l app=postgresql-{service}-migration --tail=100
```

Common issues:

- SQL syntax error
- Non-idempotent migration (fails on second run)
- Database connection issues
- Missing permissions

### Migration Job Not Running

Check if Job was created:

```bash
kubectl get jobs -n supreme-infra | grep migration
```

Check hook annotations:

```bash
kubectl get job {job-name} -n supreme-infra -o yaml | grep helm.sh/hook
```

### Manually Run Migration

If needed, you can manually execute a migration:

```bash
kubectl exec -n supreme-infra postgresql-{service}-0 -- \
  psql -U {db_user} -d {db_name} \
  -c "$(cat infra/databases/{service}-db/migrations/XXX_migration.sql)"
```

## Best Practices

1. **Always write idempotent migrations** - Use `ON CONFLICT`, `IF NOT EXISTS`, etc.
2. **Test locally first** - Run migration on local database before deploying
3. **Keep migrations small** - One logical change per migration
4. **Never modify old migrations** - Create new ones instead
5. **Use descriptive names** - Make it clear what the migration does
6. **Add comments** - Explain why the migration is needed
7. **Backup before major changes** - Especially for production

## Examples

### Example 1: Add Test User

```sql
-- Migration: Create test user for development
INSERT INTO "user" (id, name, email)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test User', 'test@example.com')
ON CONFLICT (id) DO NOTHING;
```

### Example 2: Add Column

```sql
-- Migration: Add phone column to user table
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS phone VARCHAR;

-- Update existing test user
UPDATE "user"
SET phone = '+7 (999) 123-45-67'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
  AND phone IS NULL;
```

### Example 3: Create New Table

```sql
-- Migration: Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id),
    theme VARCHAR NOT NULL DEFAULT 'light',
    language VARCHAR NOT NULL DEFAULT 'ru',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON user_preferences(user_id);
```

## See Also

- `infra/databases/{service}-db/migrations/README.md` - Service-specific migration docs
- `infra/helmcharts/postgresql/README.md` - PostgreSQL Helm chart documentation
- `infra/generate/generate-database-values/README.md` - Database values generator
