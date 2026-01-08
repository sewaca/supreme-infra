# Backend Service

NestJS backend service with PostgreSQL database for authentication.

## Features

- User authentication with JWT
- PostgreSQL database with TypeORM
- Recipe management
- OpenTelemetry instrumentation
- Prometheus metrics
- Comprehensive database logging

## Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 16+ (or Docker)

## Local Development

### 1. Start PostgreSQL

Using Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Or using Docker directly:

```bash
docker run --name postgres-dev \
  -e POSTGRES_USER=auth_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=auth_db \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm run dev
```

The server will start on http://localhost:4000

### 5. Access API

- Health check: http://localhost:4000/api/status
- Metrics: http://localhost:9464/metrics
- API endpoints: http://localhost:4000/api/\*

## Database

### Migrations

```bash
# Generate migration from entities
pnpm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert
```

### Default Users

Three users are created automatically on first run:

1. **Admin**
   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. **Moderator**
   - Email: moder@example.com
   - Password: moder123
   - Role: moderator

3. **User**
   - Email: user@example.com
   - Password: user123
   - Role: user

## Testing

```bash
# Run unit tests
pnpm run unit --verbose

# Run tests with coverage
pnpm run unit:coverage
```

## Building

```bash
# Build for production
pnpm run build

# Run production build
pnpm run prod
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires JWT)

### Recipes

- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create recipe (requires JWT, moderator+)
- `PUT /api/recipes/:id` - Update recipe (requires JWT, moderator+)
- `DELETE /api/recipes/:id` - Delete recipe (requires JWT, admin)
- `POST /api/recipes/:id/like` - Toggle recipe like (requires JWT)

### Health

- `GET /api/status` - Health check endpoint

## Environment Variables

| Variable      | Description        | Default     |
| ------------- | ------------------ | ----------- |
| PORT          | Server port        | 4000        |
| NODE_ENV      | Environment        | development |
| DB_HOST       | PostgreSQL host    | localhost   |
| DB_PORT       | PostgreSQL port    | 5432        |
| DB_NAME       | Database name      | auth_db     |
| DB_USER       | Database user      | auth_user   |
| DB_PASSWORD   | Database password  | -           |
| JWT_SECRET    | JWT signing secret | -           |
| LOKI_ENDPOINT | Loki logs endpoint | -           |

## Project Structure

```
src/
├── app.module.ts           # Main application module
├── main.ts                 # Application entry point
├── instrumentation.ts      # OpenTelemetry setup
├── database/               # Database configuration
│   ├── data-source.ts      # TypeORM data source
│   └── migrations/         # Database migrations
├── features/               # Feature modules
│   ├── Auth/               # Authentication feature
│   │   ├── api/            # Controllers and modules
│   │   └── model/          # Services and entities
│   ├── Recipes/            # Recipes feature
│   └── HealthCheck/        # Health check feature
└── shared/                 # Shared utilities
    ├── guards/             # Auth guards
    └── api/                # External API clients
```

## Troubleshooting

### Cannot connect to PostgreSQL

1. Check if PostgreSQL is running:

   ```bash
   docker ps | grep postgres
   ```

2. Check connection:

   ```bash
   psql -h localhost -U auth_user -d auth_db
   ```

3. Verify environment variables:
   ```bash
   cat .env | grep DB_
   ```

### TypeORM errors

1. Drop and recreate database:

   ```bash
   docker exec -it supreme-postgres-dev psql -U auth_user -d postgres -c "DROP DATABASE auth_db;"
   docker exec -it supreme-postgres-dev psql -U auth_user -d postgres -c "CREATE DATABASE auth_db;"
   ```

2. Restart the application (tables will be auto-created in development)

## Database Logging

Backend logs all database operations for debugging and monitoring.

See [DATABASE_LOGGING.md](DATABASE_LOGGING.md) for details.

### Quick view logs

```bash
# In Kubernetes
kubectl logs deployment/backend -n default --tail=100 -f | grep TypeORM

# Locally
pnpm run start:dev
```

### What's logged

- 🔌 Database connection details on startup
- 📊 Every SQL query with parameters
- ❌ Query errors
- 🐌 Slow queries (>1s)

## Deployment

See [database-setup.md](../../docs/database-setup.md) for production deployment instructions.

## License

ISC
