# @supreme-int/api-client

Shared API client library for all backend services (NestJS and FastAPI).

## Features

- Type-safe API clients for all services
- Auto-generated from OpenAPI schemas
- Manual clients for NestJS services (core-auth-bff, core-recipes-bff)
- Auto-generated clients for FastAPI services (core-client-info, core-applications)

## Generated Clients

### FastAPI Services

Clients are auto-generated from OpenAPI schemas using `@hey-api/openapi-ts`.

#### Available Services:

- `core-client-info` - User profile, settings, ratings, achievements
- `core-applications` - Applications, references, orders, dormitory

#### Usage:

```typescript
import { CoreClientInfo } from "@supreme-int/api-client";

// Use the generated SDK
const response = await CoreClientInfo.getProfile({ path: { userId: 123 } });

// Or import directly from the service
import * as CoreClientInfo from "@supreme-int/api-client/core-client-info";
import type { GetProfileData, GetProfileResponse } from "@supreme-int/api-client/core-client-info";
```

### Manual Clients (NestJS)

#### core-auth-bff

```typescript
import { AuthApi } from "@supreme-int/api-client";

const authApi = new AuthApi("http://localhost:4001/core-auth-bff");
const user = await authApi.login({ email, password });
```

#### core-recipes-bff

```typescript
import { RecipesApi } from "@supreme-int/api-client";

const recipesApi = new RecipesApi("http://localhost:4000/core-recipes-bff");
const recipes = await recipesApi.getRecipes();
```

## Regenerating Clients

When FastAPI services change their API:

```bash
# From repository root
pnpm run generate:api-client
```

This will:

1. Export OpenAPI schemas from all FastAPI services
2. Copy schemas to `packages/api-client/schemas/`
3. Generate TypeScript clients using `@hey-api/openapi-ts`

## Adding New FastAPI Services

When creating a new FastAPI service with the generator (`pnpm run generate:service`), the API client configuration is automatically updated. The generator will:

1. Add the service to `openapi-ts.config.ts`
2. Add the export to `src/index.ts`

Then run `pnpm run generate:api-client` to generate the client.
