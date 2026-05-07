# CLAUDE.md — supreme-infra

## Stack

- **Monorepo**: pnpm 10 workspaces, Node 24
- **Backend**: NestJS (TypeScript), FastAPI (Python 3.12+)
- **Frontend**: Next.js (App Router, SSR), MUI + design-system
- **DB**: PostgreSQL 16 + PgBouncer
- **Auth**: `core-auth` (FastAPI, port 8002) — единственный источник правды
- **Observability**: OpenTelemetry, Loki, Victoria Metrics, Grafana
- **Linter**: Biome (TS/JS), Ruff (Python)

## Commands

```bash
pnpm lint                  # Biome + deps check
pnpm format                # Biome + Prettier (md/yaml)
pnpm run format:biome      # Biome only
pnpm -r tsc                # TypeScript check all services
pnpm -r unit               # Unit tests all services
pnpm run generate          # Regenerate all infra (run after services.yaml changes)

cd services/<name> && pnpm run unit --verbose  # Unit tests for specific service
```

## Code Style

**TypeScript/JavaScript** (Biome):
- 2 spaces, line width 120
- Single quotes in TS/JS, double quotes in JSX
- Strict mode: no `any`, no unused vars/params, explicit return types on public methods
- No barrel imports from `@supreme-int/*` — use direct paths:
  ```ts
  import { typography } from "@supreme-int/design-system/src/typography";
  ```

**Testing** (Vitest):
- Mock ALL external dependencies
- Write mocks in one-line format (no line breaks inside mock objects)
- AAA pattern (Arrange, Act, Assert)
- Never use `any` in tests

**Python** (Ruff): 4 spaces, double quotes, line length 120.

## Architecture

**Feature-Sliced Design** in `src/`:
```
services/<service>/src/
├── entities/     # domain models & types
├── features/     # business logic (NestJS: controllers, services, modules)
├── views/        # page compositions
├── widgets/      # UI blocks
└── shared/       # api, hooks, lib, theme
```

**Naming**:
- PascalCase: components, classes, interfaces, types (`PostCard.tsx`, `PostsService`)
- camelCase: utilities, variables, functions (`backendApi.ts`, `getPostsSummary`)
- UPPER_SNAKE_CASE: constants (`BASE_URL`)
- CSS modules: `ComponentName.module.css`
- Tests: `ComponentName.spec.ts`

## Next.js SSR

Pages with server-side API calls **must** have:
```ts
export const dynamic = 'force-dynamic';
```
Without it, `next build` fails when backend services are unreachable (e.g. in Docker).

API clients in SSR: configure via `createServerFetch` from `@supreme-int/nextjs-shared`, export from `shared/api/clients.ts`.

## PR Titles

Must start with one of:
- `major:` — breaking changes
- `minor:` — new features / refactoring
- `fix:` — bug fixes / patches
- `chore:` — no release (tests, docs, CI)

Examples: `minor(ui): Changed button color`, `fix: Fixed memory leak`

## Infrastructure Generator

`services.yaml` is the **single source of truth** for all services.

After any change to `services.yaml` or `service.yaml`:
```bash
pnpm run generate
```
Generates: Helm overrides (`infra/overrides/`), CD workflow service list, security check matrices, router configs.

**NEVER edit generated files manually** (`infra/overrides/` files are auto-generated).

## Database

- Schema & seed: `infra/databases/{service}-db/init.sql` — runs **once** on empty volume
- Migrations: `infra/databases/{service}-db/migrations/001_*.sql` — applied on `helm upgrade`
- All SQL must be **idempotent** (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
- Apps connect via PgBouncer: `DB_HOST: pgbouncer-{service}`

Adding a DB to a service:
1. Add `database.enabled: true` in `services.yaml`
2. Create `infra/databases/{service}-db/` with `init.sql` / `migrations/`
3. Run `pnpm run generate`
4. Deploy via GitHub Actions → Deploy Database

## Release & Deploy

Releases are triggered manually via GitHub Actions → "Create Release Pipeline".

Versioning from commit prefixes: `major:` → X+1.0.0, `minor:/feat:` → x.Y+1.0, `fix:` → x.y.Z+1, `chore:` → no new version.

**Canary flow**: new version deploys as canary (50% replicas) → manual approval → promote to production.

**Rollback**: run CD workflow with `release_branch = releases/production/{service}-{version}`.

Docker image format: `{DOCKER_HUB_USERNAME}/supreme:production-{service}-v{version}`

## Auth Packages

- **`@supreme-int/authorization-lib`** (TS) — `packages/authorization-lib/`
  - JWT verify: `src/jwt/verify-jwt.ts`
  - Session check: `src/session/check-session.ts`
  - No barrel exports — import by absolute path
- **`authorization-py`** (Python) — `packages/authorization-py/`
  - FastAPI Depends: `get_current_user`, `require_valid_session`
- **`@supreme-int/nestjs-shared`** — `SessionCheckInterceptor`
- **Next.js middleware** — `createRouteAuthMiddleware` from `nextjs-shared`

## Restrictions

- **Never** execute `kubectl` or `helm` commands directly
- **Never** commit secrets or `.env.local` files
- Sгенерированные overrides не редактировать вручную — только через generate
