# Backend Database

PostgreSQL database for backend service.

## Database Info

- **Name**: backend_db
- **User**: backend_user
- **Service**: backend

## Tables

### users

User accounts and authentication.

| Column     | Type      | Description                |
| ---------- | --------- | -------------------------- |
| id         | serial    | Primary key                |
| email      | varchar   | Unique email               |
| password   | varchar   | Bcrypt hashed password     |
| name       | varchar   | User display name          |
| role       | varchar   | user/moderator/admin       |
| created_at | timestamp | Account creation timestamp |

### recipe_likes

Recipe likes by users.

| Column    | Type      | Description             |
| --------- | --------- | ----------------------- |
| id        | serial    | Primary key             |
| user_id   | integer   | Foreign key to users    |
| recipe_id | integer   | Recipe ID               |
| liked_at  | timestamp | Like creation timestamp |

## Initial Data

The database is automatically initialized with data from `init.sql` when PostgreSQL starts for the first time.

This script creates three default users:

1. **admin@example.com** / admin123 (admin)
2. **moder@example.com** / moder123 (moderator)
3. **user@example.com** / user123 (user)

### Updating Initial Data

Edit `init.sql` and run:

```bash
pnpm run generate
```

This will update the Helm values with the new init script.

### Schema Migrations

For schema changes after initial deployment, TypeORM handles migrations automatically:

- **Development**: `synchronize: true` - schema updates automatically
- **Production**: Use TypeORM migrations in the service code

## Connection

From within Kubernetes cluster:

```
Host: postgresql-backend.default.svc.cluster.local
Port: 5432
Database: backend_db
User: backend_user
```

## Backup

```bash
kubectl exec postgresql-backend-0 -- pg_dump -U backend_user backend_db > backup.sql
```

## Restore

```bash
kubectl exec -i postgresql-backend-0 -- psql -U backend_user backend_db < backup.sql
```
