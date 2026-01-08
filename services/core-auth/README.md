# core-auth

core authorization backend (Nest JS)

## Features

- NestJS backend service
- PostgreSQL database with TypeORM
- OpenTelemetry instrumentation
- Prometheus metrics
- Health check endpoint

## Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 16+ (or Docker)

## Local Development

### 1. Start PostgreSQL

Using Docker:

```bash
docker run --name core-auth-postgres \
  -e POSTGRES_USER=core_auth_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=core_auth_db \
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

The server will start on http://localhost:4001

### 5. Access API

- Health check: http://localhost:4001/core-auth/api/status
- Metrics: http://localhost:9464/metrics

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

## Environment Variables

| Variable           | Description                                     | Default        |
| ------------------ | ----------------------------------------------- | -------------- |
| PORT               | Server port                                     | 4001           |
| NODE_ENV           | Environment                                     | development    |
| DB_HOST            | PostgreSQL host                                 | localhost      |
| DB_PORT            | PostgreSQL port                                 | 5432           |
| DB_NAME            | Database name                                   | core_auth_db   |
| DB_USER            | Database user                                   | core_auth_user |
| DB_PASSWORD        | Database password                               | -              |
| SKIP_DB_CONNECTION | Skip database connection (for route generation) | false          |
| LOKI_ENDPOINT      | Loki logs endpoint                              | -              |

## License

ISC
