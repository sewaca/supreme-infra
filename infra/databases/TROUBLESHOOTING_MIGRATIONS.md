# Troubleshooting Database Migrations

## Common Issues and Solutions

### 1. Migration Job Failed: BackoffLimitExceeded

**Error:**

```
Error: UPGRADE FAILED: post-upgrade hooks failed: 1 error occurred:
	* job postgresql-{service}-migration-{timestamp} failed: BackoffLimitExceeded
```

**Cause:** The migration job failed 3 times (backoffLimit: 3) and gave up.

**Solution:**

1. **Check job logs:**

```bash
# Find the failed job
kubectl get jobs -n default | grep migration

# Check logs
kubectl logs -n default job/postgresql-{service}-migration-{timestamp}
```

2. **Common causes:**

   a) **Database not ready:**
   - The initContainer waits up to 60 seconds for DB to be ready
   - Check if PostgreSQL pod is running:

   ```bash
   kubectl get pods -n default -l app.kubernetes.io/name=postgresql
   ```

   b) **Connection issues:**
   - Check service exists:

   ```bash
   kubectl get svc -n default | grep postgresql
   ```

   - Verify DNS resolution from within cluster

   c) **SQL syntax error:**
   - Check migration file for errors
   - Test locally first

   d) **Non-idempotent migration:**
   - Migration fails on second run
   - Always use `ON CONFLICT DO NOTHING`, `IF NOT EXISTS`, etc.

3. **Fix and retry:**

```bash
# Fix the migration file
# Then regenerate values
pnpm run generate

# Delete failed job
kubectl delete job -n default postgresql-{service}-migration-{timestamp}

# Retry upgrade
helm upgrade postgresql-{service} ./infra/helmcharts/postgresql \
  --namespace default \
  -f infra/overrides/production/postgresql-{service}.yaml \
  --set database.password="$DB_PASSWORD"
```

### 2. Migration Job Stuck in Pending

**Symptoms:** Job pod never starts

**Check:**

```bash
kubectl describe job -n default postgresql-{service}-migration-{timestamp}
kubectl get pods -n default | grep migration
kubectl describe pod -n default {migration-pod-name}
```

**Common causes:**

- Insufficient resources
- Image pull errors
- ConfigMap not created

**Solution:**

```bash
# Check if ConfigMap exists
kubectl get configmap -n default | grep migrations

# Check ConfigMap content
kubectl describe configmap -n default postgresql-{service}-migrations
```

### 3. Migration Runs But Data Not Applied

**Symptoms:** Job succeeds but data is missing

**Check:**

```bash
# Verify migration ran
kubectl logs -n default -l app=postgresql-{service}-migration

# Check database directly
kubectl exec -n default postgresql-{service}-0 -- \
  psql -U {db_user} -d {db_name} \
  -c "SELECT COUNT(*) FROM \"user\";"
```

**Possible causes:**

- Migration used wrong database name
- Migration has logic error (e.g., WHERE clause too restrictive)
- Transaction rolled back

**Solution:**

- Review migration SQL
- Test migration locally first
- Check for database errors in logs

### 4. Cannot Connect to Database

**Error in logs:**

```
✗ Failed to connect to database
```

**Debug steps:**

```bash
# 1. Check PostgreSQL pod is running
kubectl get pods -n default -l app.kubernetes.io/instance=postgresql-{service}

# 2. Check service exists
kubectl get svc -n default postgresql-{service}

# 3. Test connection from another pod
kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -- \
  psql -h postgresql-{service}.default.svc.cluster.local -U {db_user} -d {db_name}

# 4. Check PostgreSQL logs
kubectl logs -n default postgresql-{service}-0
```

### 5. Migration File Not Found

**Error in logs:**

```
No migrations found in /migrations
```

**Cause:** ConfigMap not created or empty

**Check:**

```bash
# Verify migrations in values file
grep -A5 "migrations:" infra/overrides/production/postgresql-{service}.yaml

# Check ConfigMap
kubectl get configmap -n default postgresql-{service}-migrations -o yaml
```

**Solution:**

```bash
# Ensure migration files exist
ls -la infra/databases/{service}-db/migrations/

# Regenerate values
pnpm run generate

# Redeploy
helm upgrade ...
```

### 6. Helm Hook Not Triggering

**Symptoms:** Migration job never created

**Check:**

```bash
# List all jobs
kubectl get jobs -n default

# Check helm release hooks
helm get hooks postgresql-{service} -n default
```

**Verify template:**

```bash
# Check if migration-job.yaml has correct annotations
grep "helm.sh/hook" infra/helmcharts/postgresql/templates/migration-job.yaml
```

Should show:

```yaml
"helm.sh/hook": post-upgrade
"helm.sh/hook-weight": "1"
"helm.sh/hook-delete-policy": before-hook-creation
```

### 7. Old Failed Jobs Blocking New Ones

**Cause:** `before-hook-creation` policy should delete old jobs, but sometimes they remain

**Solution:**

```bash
# List all migration jobs
kubectl get jobs -n default | grep migration

# Delete old failed jobs
kubectl delete job -n default postgresql-{service}-migration-{old-timestamp}

# Or delete all migration jobs
kubectl delete jobs -n default -l app=postgresql-{service}-migration
```

## Best Practices to Avoid Issues

1. **Always test migrations locally first:**

```bash
# Test on local database
psql -U {user} -d {db} -f infra/databases/{service}-db/migrations/002_new.sql
```

2. **Write idempotent migrations:**

```sql
-- Good
INSERT INTO "user" (...) VALUES (...) ON CONFLICT (id) DO NOTHING;

-- Bad
INSERT INTO "user" (...) VALUES (...);  -- Fails on second run
```

3. **Add verbose logging:**

```sql
-- Add comments explaining what the migration does
-- Migration: Add phone column to user table
-- This is needed for SMS notifications feature

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS phone VARCHAR;
```

4. **Keep migrations small:**

- One logical change per migration
- Easier to debug if something fails

5. **Monitor job execution:**

```bash
# Watch job status
kubectl get jobs -n default -w | grep migration

# Stream logs in real-time
kubectl logs -n default -l app=postgresql-{service}-migration -f
```

## Emergency Recovery

If migrations are completely broken and blocking deployments:

### Option 1: Disable Migrations Temporarily

Use the `skipMigrations` flag:

```bash
helm upgrade postgresql-{service} ./infra/helmcharts/postgresql \
  --namespace default \
  --set skipMigrations=true \
  -f infra/overrides/production/postgresql-{service}.yaml
```

Or edit values file manually:

```yaml
# infra/overrides/production/postgresql-{service}.yaml
skipMigrations: true
```

Deploy without migrations, fix the issue, then set back to `false`.

### Option 2: Skip Hook

```bash
# Upgrade without hooks (dangerous!)
helm upgrade postgresql-{service} ./infra/helmcharts/postgresql \
  --namespace default \
  --no-hooks \
  -f infra/overrides/production/postgresql-{service}.yaml
```

**Warning:** This skips ALL hooks including migrations. Use only as last resort.

### Option 3: Manual Migration

Apply migrations manually, then upgrade:

```bash
# Apply migration manually
cat infra/databases/{service}-db/migrations/001_*.sql | \
kubectl exec -i -n default postgresql-{service}-0 -- \
  psql -U {db_user} -d {db_name}

# Then upgrade normally
helm upgrade ...
```

## Getting Help

If you're still stuck:

1. Collect diagnostics:

```bash
# Job status
kubectl get jobs -n default | grep migration

# Job details
kubectl describe job -n default postgresql-{service}-migration-{timestamp}

# Pod logs
kubectl logs -n default -l app=postgresql-{service}-migration --tail=200

# PostgreSQL status
kubectl get pods -n default -l app.kubernetes.io/instance=postgresql-{service}
kubectl logs -n default postgresql-{service}-0 --tail=100
```

2. Check migration file syntax:

```bash
# Validate SQL locally
psql -U postgres -d postgres -f infra/databases/{service}-db/migrations/XXX_file.sql --dry-run
```

3. Review recent changes:

```bash
git log --oneline infra/databases/{service}-db/migrations/
git diff HEAD~1 infra/databases/{service}-db/migrations/
```
