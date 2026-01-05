# supreme-infra

Repository with fully setted up infrastructure settings. Was designed as monorepo for microservice application with Next and Nest js. But actually, it can be easily scaled for any other tech stack.

What we support now:

- Nginx (as reverse-proxy)
- Next
- Nest

## Prerequisites

### Secrets

Initially you have to define some secrets in repository, for correct work of actions and jobs.

All secrets you need are:

- PAT – GitHub personal access token <br />
  This token neccessary for all Madara Robot operations. (i.e. commit pre-commit diff, generate services, etc) <br />
  Format of secret is: `PAT=github_pat_XXX`
- DOCKER_HUB_USERNAME – Docker Hub repository owners' username <br />
  We use this token to: authenticate in Docker Hub, when pushing image to regestry, and also we calculate Docker Hub repo name with this token <br />
  Format of secret is: `DOCKER_HUB_USERNAME=xxxxxxxxx`
- DOCKER_HUB_TOKEN – Access token for user, whos username was provided in DOCKER_HUB_USERNAME <br />
  With this token we push builded images to the regestry. So, sure we need **write** access <br />
  Format of secret is: `DOCKER_HUB_TOKEN=xxx_xxxxxxxxxxx`
- YC_SA_JSON_CREDENTIALS – Yandex Cloud service account JSON credentials <br />
  Required for Kubernetes deployments
- YC_CLOUD_ID – Yandex Cloud ID
- YC_FOLDER_ID – Yandex Cloud folder ID
- YC_K8S_CLUSTER_ID – Kubernetes cluster ID in Yandex Cloud
- JWT_SECRET – Secret key for JWT token signing and verification <br />
  Used by backend service for authentication. Generate with: `openssl rand -base64 32` <br />
  Format of secret is: `JWT_SECRET=your-secure-random-string`

For detailed information about secrets management, see **[Secrets Management](docs/secrets-management.md)**.

### GitHub Environments

You need to create two environments in GitHub repository settings:

- **canary** – Environment for canary deployments (can be auto-approved or with reviewers)
- **production** – Environment with required reviewers for production promotion

## Infra:

### Build services

To make your service ready for production:

1. Create Dockerfile (i.e. services/frontend/Dockerfile)
2. Run Dockerfile from root <br />
   `docker build -f services/frontend/Dockerfile -t supreme-frontend-v1.0.0`
3. Add release pipeline

It's required to correctly deploy application to k8s managed cluster

### Release service

To run production release of your service run [Create Release Pipeline](https://github.com/sewaca/supreme-infra/actions/workflows/cd.yml)

It will make all neccessary tasks:

1. Detect current version-tag of service
2. Calculate neccessary new version-tag of service by diff
3. Create release/production/{service_name}-v{service_version-tag}
4. Build Docker image and upload it to [project registry](https://hub.docker.com/repository/docker/sewaca/supreme/general)
5. Create GitHub release
6. Deploy canary pods (50% of current replicas)
7. Wait for manual approval
8. Promote to production (update main deployment, remove canary)

Edge-cases:

- If you start release and there is 0 new commits since last release – pipeline will fall down
- If you start release where presented only `chore` new changes – release will be called rollback and will not create new version in registry

### Canary Deployments

All releases go through a canary stage before full production deployment:

1. **Canary Phase**: New version is deployed as canary pods (50% of current replica count)
   - Old pods continue running
   - Traffic is split between old and new pods
   - Canary pods have label `app.kubernetes.io/variant: canary`

2. **Manual Approval**: Pipeline waits for approval in `production` environment
   - Review canary metrics and logs
   - Approve to promote to production
   - Reject/Cancel to keep old version

3. **Promotion**: On approval, main deployment is updated and canary pods are removed

4. **Cancellation**: If cancelled, canary pods will be cleaned up on next deployment

### Rollback

To rollback to a previous version:

1. Go to [Create Release Pipeline](https://github.com/sewaca/supreme-infra/actions/workflows/cd.yml)
2. Click "Run workflow"
3. Select the service to rollback
4. In **release_branch** field, enter the release branch name, e.g.:
   ```
   releases/production/frontend-3.1.5
   ```
5. Run the workflow

**What happens during rollback:**

1. Validates that the release branch exists
2. Checks that Docker image for that version exists in registry
3. Rebases the release branch onto main (to get fresh helm overrides)
4. Creates a rollback GitHub release
5. Deploys canary with the old version
6. Waits for manual approval
7. Promotes rollback to production

**Important notes:**

- The Docker image must exist in the registry for the rollback to work
- Rebase ensures you get the latest infrastructure configuration
- Rollback also goes through canary stage for safety

### Service overrides

For easy manage of all infra files, there is common [infra generator](https://github.com/sewaca/supreme-infra/tree/main/infra/generate-service).

His only purpose – generate infra files in correct state by services config.

So, if you want to generate overrides for your service (i.e. wanna see your service in release flow), you need:

1. Make sure your service is inside services config in right place.
2. Run `pnpm ingra:generate` in root of monorepo
3. Commit all changes

### Helm Charts

We use Helm for Kubernetes deployments. Charts are located in `infra/helmcharts/`:

- `backend-service/` – Chart for NestJS services
- `frontend-service/` – Chart for Next.js services

Each service has its overrides in `infra/overrides/{environment}/{service}.yaml`

**Key Helm values:**

```yaml
image:
  repository: sewaca/supreme
  tag: production-backend-v1.2.3

canary:
  enabled: false
  replicas: 1
  image:
    repository: ""
    tag: ""

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
```

### PR Titles

PR title MUST start with one of the configured pattern, meaning which release current changes need.
Otherwise PR will not pass checks.

Available starting tags:

- **major** <br /> breaking changes for application
- **minor** <br /> minor changes or refactoring
- **fix** <br /> fir or local improvement. will create patch release
- **chore** <br /> any changes, has no affect on applcation (i.e. tests, docs, ci) <br /> will not create release

Examples of correctly named PRs:

- minor(ui): Changed Button color
- major: Refactored X functionality
- major: Added Y functionality
- chore: Added ai memory-bank

### Style conventions

#### Code Formatting & Linting

We use **Biome** as our primary code formatter and linter:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JavaScript/TypeScript, double quotes for JSX
- **Line endings**: LF (Unix)
- **Semicolons**: Required
- **Trailing commas**: Required in multiline structures

**Biome configuration** (`biome.json`):

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "rules": {
      "recommended": true,
      "style": {
        "useImportType": "off"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double"
    }
  }
}
```

#### TypeScript Configuration

**Strict TypeScript settings** (`tsconfig.base.json`):

- Strict mode enabled
- No unused locals/parameters
- No implicit returns/overrides
- Explicit types required
- No `any` type usage

#### Project Structure

We follow **Feature-Sliced Design** architecture:

```
services/
├── backend/           # NestJS service
│   └── src/
│       ├── app.module.ts
│       ├── features/    # Business logic features
│       │   └── Posts/
│       │       ├── Posts.controller.ts
│       │       ├── Posts.service.ts
│       │       └── Posts.module.ts
│       └── shared/      # Shared utilities and API
└── frontend/          # Next.js service
    └── src/
        ├── app/        # Next.js app router
        ├── entities/   # Business entities (Post, Comment)
        ├── features/   # Feature components
        ├── shared/     # Shared utilities and API
        ├── views/      # Page components
        └── widgets/    # UI components
```

#### Naming Conventions

**Files & Directories**:

- PascalCase for components: `PostCard.tsx`, `PostsService.ts`
- camelCase for utilities: `backendApi.ts`, `jsonplaceholderDatasource.ts`
- kebab-case for CSS modules: `PostCard.module.css`

**Code**:

- PascalCase for classes, interfaces, types: `PostsController`, `PostSummary`
- camelCase for variables, functions, methods: `getPostsSummary()`, `postId`
- Private methods start with lowercase: `countCommentsByPostId()`
- Constants in UPPER_SNAKE_CASE: `BASE_URL`

#### React Components

**Functional components** with TypeScript:

```tsx
interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </div>
  );
}
```

#### Backend (NestJS)

**Controller structure**:

```ts
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get("summary")
  public async getSummary(): Promise<PostSummary[]> {
    return this.postsService.getPostsSummary();
  }
}
```

**Service structure**:

```ts
@Injectable()
export class PostsService {
  public async getPostsSummary(): Promise<PostSummary[]> {
    // Implementation
  }

  private countCommentsByPostId(comments: Comment[]): Map<number, number> {
    // Private helper method
  }
}
```

#### API Layer

**Backend API client** (Singleton pattern):

```ts
class BackendApi {
  private static instance: BackendApi | null = null;

  public static getInstance(): BackendApi {
    if (!BackendApi.instance) {
      BackendApi.instance = new BackendApi();
    }
    return BackendApi.instance;
  }

  public async getPostsSummary(): Promise<PostSummary[]> {
    const response = await fetch(`${this.baseUrl}/posts/summary`);
    return response.json();
  }
}
```

#### Testing

**Unit tests** with Vitest:

- Mock all external dependencies
- Write mocks in single line format
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```ts
describe("PostsService", () => {
  it("should return posts summary with truncated body", async () => {
    // Arrange
    const mockPosts = [{ userId: 1, id: 1, title: "Test", body: "Long body text" }];
    datasource.getPosts.mockResolvedValue(mockPosts);

    // Act
    const result = await service.getPostsSummary();

    // Assert
    expect(result[0].body).toBe("Long body ...");
  });
});
```

**Test commands**:

```bash
# Run unit tests for specific service
cd services/backend && pnpm run unit --verbose

# Run frontend tests
cd services/frontend && pnpm run unit --verbose
```

#### Import Organization

**Import grouping order**:

1. External libraries (React, NestJS, etc.)
2. Internal shared modules
3. Relative imports (parent/child directories)
4. Type imports (when needed)

```ts
import { Injectable } from "@nestjs/common";
import { JsonplaceholderDatasource } from "../../shared/api/jsonplaceholderDatasource";
import { PostSummary } from "./types";
```

#### Scripts

**Available commands**:

```bash
pnpm lint              # Run Biome linting
pnpm format            # Run Biome formatting
pnpm generate:router   # Generate service router configuration
pnpm generate:overrides # Generate Helm overrides
pnpm generate          # Run all generators
```

We use pre-commit & biome lint checks to verify everything is okay. <br />
Just commit your pretty code, with passed locally lint check. <br />
Madara-robot will take care about everything another

## Documentation

- **[Руководство по стилю кода](docs/code-style.md)** - Полные стандарты и соглашения кодирования
- **[Генератор инфраструктуры](docs/infrastructure-generator.md)** - Автоматизированное управление инфраструктурой
- **[CI/CD Pipeline](docs/ci.md)** - Настройка непрерывной интеграции и развертывания
- **[Процесс релиза](docs/release-process.md)** - Полная документация по pipeline релиза
- **[Управление секретами](docs/secrets-management.md)** - Как работать с секретами и переменными окружения

## Version Naming

- **Normal release**: `{service}-v{major}.{minor}.{patch}` (e.g., `backend-v1.2.3`)
- **Chore release**: `{service}-v{version}-{hash}` (e.g., `backend-v1.2.3-abc12345`)
- **Rollback release**: `{service}-rollback-v{version}-{short-sha}` (e.g., `backend-rollback-v1.2.3-def456`)

## Docker Image Naming

Format: `{DOCKER_HUB_USERNAME}/supreme:production-{service}-v{version}`

Example: `sewaca/supreme:production-backend-v1.2.3`
