# Code Style Guide

This document contains comprehensive information about coding standards, conventions, and best practices used in the supreme-infra monorepo.

## Table of Contents

- [Biome Configuration](#biome-configuration)
- [TypeScript Configuration](#typescript-configuration)
- [Project Structure](#project-structure)
- [Naming Conventions](#naming-conventions)
- [React Components](#react-components)
- [Backend (NestJS)](#backend-nestjs)
- [API Layer Patterns](#api-layer-patterns)
- [Testing Guidelines](#testing-guidelines)
- [Import Organization](#import-organization)
- [User Rules](#user-rules)

## Biome Configuration

Located in `biome.json`:

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useImportType": "off"
      }
    },
    "domains": {
      "next": "recommended",
      "react": "recommended"
    }
  },
  "javascript": {
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    },
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double"
    }
  }
}
```

**Key rules:**

- 2-space indentation
- Single quotes for JS/TS, double quotes for JSX
- Recommended linting rules enabled
- `useImportType` disabled (allows `import type` when needed)

## TypeScript Configuration

Base configuration in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "incremental": true,
    "esModuleInterop": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "noUnusedLocals": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noEmitOnError": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "removeComments": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUnusedParameters": true,
    "module": "esnext",
    "target": "esnext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "lib": ["dom", "esnext"]
  }
}
```

**Key settings:**

- Strict mode enabled
- No unused variables/parameters
- No implicit returns or overrides
- Explicit types required everywhere

## Project Structure

Follows **Feature-Sliced Design** architecture:

```
services/
├── backend/                      # NestJS service
│   ├── src/
│   │   ├── app.controller.spec.ts
│   │   ├── app.module.ts
│   │   ├── features/             # Business features
│   │   │   └── Posts/
│   │   │       ├── Posts.controller.spec.ts
│   │   │       ├── Posts.controller.ts
│   │   │       ├── Posts.module.ts
│   │   │       └── Posts.service.spec.ts
│   │   │       └── Posts.service.ts
│   │   └── shared/               # Shared utilities
│   │       └── api/
│   │           └── jsonplaceholderDatasource.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
└── frontend/                     # Next.js service
    ├── src/
    │   ├── app/                  # Next.js app router
    │   │   ├── [id]/
    │   │   │   └── page.tsx
    │   │   ├── api/
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── entities/             # Business entities
    │   │   └── post/
    │   │       ├── PostCard.module.css
    │   │       ├── PostCard.spec.tsx
    │   │       └── PostCard.tsx
    │   ├── features/             # Feature components
    │   ├── shared/               # Shared utilities
    │   │   └── api/
    │   │       └── backendApi.ts
    │   ├── views/                # Page components
    │   │   └── PostDetailsPage/
    │   │       └── index.tsx
    │   └── widgets/              # UI components
    │       └── Breadcrumbs/
    │           └── index.tsx
    ├── next.config.ts
    ├── package.json
    └── vitest.config.ts
```

## Naming Conventions

### Files & Directories

- **Components**: PascalCase (`PostCard.tsx`, `PostsController.ts`)
- **Utilities**: camelCase (`backendApi.ts`, `jsonplaceholderDatasource.ts`)
- **CSS Modules**: kebab-case (`PostCard.module.css`)
- **Test files**: Same name as tested file + `.spec.ts/tsx`

### Code Elements

- **Classes/Interfaces/Types**: PascalCase (`PostsController`, `PostSummary`)
- **Variables/Functions/Methods**: camelCase (`getPostsSummary()`, `postId`)
- **Constants**: UPPER_SNAKE_CASE (`BASE_URL`)
- **Private methods**: camelCase starting with lowercase (`countCommentsByPostId()`)

## React Components

**Functional components** with TypeScript interfaces:

```tsx
interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/${post.id}`} className={styles.card}>
      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.body}>{post.body}</p>
      <div className={styles.commentsCount}>Comments: {post.commentsCount}</div>
    </Link>
  );
}
```

**Key patterns:**

- Named exports preferred
- Props interfaces defined above component
- CSS modules for styling
- Early returns for conditional rendering

## Backend (NestJS)

### Controllers

```ts
import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { PostsService } from "./Posts.service";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get("get-summary")
  public async getSummary(@Query("userId") userId?: string): Promise<ReturnType<PostsService["getPostsSummary"]>> {
    const userIdNumber = userId ? Number.parseInt(userId, 10) : undefined;

    if (userId && Number.isNaN(userIdNumber)) {
      throw new BadRequestException("Invalid userId parameter");
    }

    return this.postsService.getPostsSummary(userIdNumber);
  }
}
```

### Services

```ts
import { Injectable } from "@nestjs/common";
import { Comment, JsonplaceholderDatasource } from "../../shared/api/jsonplaceholderDatasource";

export interface PostSummary {
  userId: number;
  id: number;
  title: string;
  body: string;
  commentsCount: number;
}

@Injectable()
export class PostsService {
  constructor(private readonly jsonplaceholderDatasource: JsonplaceholderDatasource) {}

  public async getPostsSummary(userId?: number): Promise<PostSummary[]> {
    const [posts, comments] = await Promise.all([
      this.jsonplaceholderDatasource.getPosts(userId),
      this.jsonplaceholderDatasource.getComments(),
    ]);

    const commentsCountByPostId = this.countCommentsByPostId(comments);

    return posts.map((post) => ({
      userId: post.userId,
      id: post.id,
      title: post.title,
      body: this.truncateBody(post.body),
      commentsCount: commentsCountByPostId.get(post.id) ?? 0,
    }));
  }

  private truncateBody(body: string): string {
    if (body.length <= 20) {
      return body;
    }
    return `${body.substring(0, 20)}...`;
  }

  private countCommentsByPostId(comments: Comment[]): Map<number, number> {
    const countMap = new Map<number, number>();

    for (const comment of comments) {
      const currentCount = countMap.get(comment.postId) ?? 0;
      countMap.set(comment.postId, currentCount + 1);
    }

    return countMap;
  }
}
```

**Key patterns:**

- Dependency injection for services
- Explicit return types
- Private methods for internal logic
- Async/await over Promises
- Early validation and error handling

## API Layer Patterns

### External API Datasources

```ts
import { Injectable } from "@nestjs/common";

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

@Injectable()
export class JsonplaceholderDatasource {
  private readonly baseUrl = "https://jsonplaceholder.typicode.com";

  public async getPosts(userId?: number): Promise<Post[]> {
    const url = userId ? `${this.baseUrl}/posts?userId=${userId}` : `${this.baseUrl}/posts`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return response.json() as Promise<Post[]>;
  }

  public async getPostById(postId: number): Promise<Post> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json() as Promise<Post>;
  }

  public async getComments(): Promise<Comment[]> {
    const response = await fetch(`${this.baseUrl}/comments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    return response.json() as Promise<Comment[]>;
  }

  public async getCommentsByPostId(postId: number): Promise<Comment[]> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}/comments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    return response.json() as Promise<Comment[]>;
  }
}
```

## Testing Guidelines

### Unit Tests with Vitest

**Configuration** (`vitest.config.global.ts`):

```ts
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: cwd(),
    include: ["**/*.spec.{ts,tsx,mts,cts}", "!**/*.screen.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html", "json"],
      reportsDirectory: "coverage",
      include: collectCoverageFrom.filter((pattern) => !pattern.startsWith("!")),
      exclude: collectCoverageFrom.filter((pattern) => pattern.startsWith("!")).map((pattern) => pattern.slice(1)),
    },
  },
});
```

**Backend Service Test Example**:

```ts
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JsonplaceholderDatasource } from "../../shared/api/jsonplaceholderDatasource";
import { PostsService } from "./Posts.service";

describe("PostsService", () => {
  let service: PostsService;
  let datasource: {
    getPosts: ReturnType<typeof vi.fn>;
    getPostById: ReturnType<typeof vi.fn>;
    getComments: ReturnType<typeof vi.fn>;
    getCommentsByPostId: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    datasource = {
      getPosts: vi.fn(),
      getPostById: vi.fn(),
      getComments: vi.fn(),
      getCommentsByPostId: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: JsonplaceholderDatasource,
          useValue: datasource,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe("getPostsSummary", () => {
    it("should return posts summary with truncated body and comments count", async () => {
      const mockPosts = [
        {
          userId: 1,
          id: 1,
          title: "Test",
          body: "This is a very long body text",
        },
        { userId: 1, id: 2, title: "Test 2", body: "Short" },
      ];

      const mockComments = [
        {
          postId: 1,
          id: 1,
          name: "Test",
          email: "test@test.com",
          body: "Comment 1",
        },
        {
          postId: 1,
          id: 2,
          name: "Test",
          email: "test@test.com",
          body: "Comment 2",
        },
        {
          postId: 2,
          id: 3,
          name: "Test",
          email: "test@test.com",
          body: "Comment 3",
        },
      ];

      datasource.getPosts.mockResolvedValue(mockPosts);
      datasource.getComments.mockResolvedValue(mockComments);

      const result = await service.getPostsSummary();

      expect(result).toEqual([
        {
          userId: 1,
          id: 1,
          title: "Test",
          body: "This is a very long ...",
          commentsCount: 2,
        },
        {
          userId: 1,
          id: 2,
          title: "Test 2",
          body: "Short",
          commentsCount: 1,
        },
      ]);
    });

    it("should filter posts by userId when provided", async () => {
      const mockPosts = [{ userId: 1, id: 1, title: "Test", body: "Body" }];

      const mockComments: never[] = [];

      datasource.getPosts.mockResolvedValue(mockPosts);
      datasource.getComments.mockResolvedValue(mockComments);

      await service.getPostsSummary(1);

      expect(datasource.getPosts).toHaveBeenCalledWith(1);
    });

    it("should return 0 comments count when no comments exist", async () => {
      const mockPosts = [{ userId: 1, id: 1, title: "Test", body: "Body" }];

      const mockComments: never[] = [];

      datasource.getPosts.mockResolvedValue(mockPosts);
      datasource.getComments.mockResolvedValue(mockComments);

      const result = await service.getPostsSummary();

      expect(result[0].commentsCount).toBe(0);
    });
  });

  describe("getPostDetails", () => {
    it("should return post details with full body and comments", async () => {
      const mockPost = {
        userId: 1,
        id: 1,
        title: "Test",
        body: "Full body text",
      };

      const mockComments = [
        {
          postId: 1,
          id: 1,
          name: "Test User",
          email: "test@test.com",
          body: "Comment text",
        },
      ];

      datasource.getPostById.mockResolvedValue(mockPost);
      datasource.getCommentsByPostId.mockResolvedValue(mockComments);

      const result = await service.getPostDetails(1);

      expect(result).toEqual({
        userId: 1,
        id: 1,
        title: "Test",
        body: "Full body text",
        comments: mockComments,
      });
    });
  });
});
```

**Frontend Component Test Example**:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostSummary } from "../../shared/api/backendApi";
import { PostCard } from "./PostCard";

// Mock Next.js Link component
vi.mock("next/link", () => {
  return {
    default: function MockLink({
      children,
      href,
      className,
    }: {
      children: React.ReactNode;
      href: string;
      className?: string;
    }) {
      return (
        <a href={href} className={className}>
          {children}
        </a>
      );
    },
  };
});

describe("PostCard", () => {
  const mockPost: PostSummary = {
    userId: 1,
    id: 1,
    title: "Test Post",
    body: "Test body",
    commentsCount: 5,
  };

  it("should render post card with correct props", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("Test Post")).toBeInTheDocument();
    expect(screen.getByText("Test body")).toBeInTheDocument();
    expect(screen.getByText("Comments: 5")).toBeInTheDocument();
  });

  it("should have correct link href", () => {
    render(<PostCard post={mockPost} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/1");
  });
});
```

**Key testing principles:**

- Mock ALL external dependencies
- Write mocks in single line format
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test both success and error cases
- Use `beforeEach` for test setup

**Test commands**:

```bash
# Run unit tests for specific service
cd services/backend && pnpm run unit --verbose
cd services/frontend && pnpm run unit --verbose
```

## Import Organization

**Import grouping and ordering**:

1. **External libraries** (React, NestJS, testing libraries)
2. **Internal shared modules** (from shared/)
3. **Relative imports** (parent/child directories)
4. **Type imports** (when needed)

**Examples**:

Backend service:

```ts
import { Injectable } from "@nestjs/common";
import { Comment, JsonplaceholderDatasource } from "../../shared/api/jsonplaceholderDatasource";
import { PostsService } from "./Posts.service";
```

Frontend component:

```tsx
import Link from "next/link";
import { PostSummary } from "../../shared/api/backendApi";
import styles from "./PostCard.module.css";
```

Test file:

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostSummary } from "../../shared/api/backendApi";
import { PostCard } from "./PostCard";
```

## User Rules

These are specific rules set by the user that must be followed:

1. **Mock format**: When creating mocks, write them in one line. Each mock object/array should not have line breaks inside.

2. **Testing command**: To run tests, use `pnpm run unit` in the service root directory (e.g., `services/pudge` or `services/web-transfers-ssr`). Always add `--verbose` and ensure tests don't run too long. When writing tests, always mock all external dependencies.

3. **TypeScript types**: NEVER use TypeScript's `any` type.

## Scripts and Commands

**Root level commands** (`package.json`):

```json
{
  "scripts": {
    "lint": "biome check",
    "format": "biome format --fix",
    "generate:router": "tsx infra/generate/generate-router/index.ts",
    "generate:overrides": "tsx infra/generate-overrides/index.ts",
    "generate": "tsx infra/generate/index.ts"
  }
}
```

**Package management**:

- Uses `pnpm` as package manager
- Node.js version 22 required
- pnpm version 9 required

**Available commands**:

```bash
pnpm lint              # Run Biome linting
pnpm format            # Run Biome formatting (auto-fix)
pnpm generate:router   # Generate service router configuration
pnpm generate:overrides # Generate Helm overrides for services
pnpm generate          # Run all generators
```

## Pre-commit Hooks

The project uses pre-commit hooks to ensure code quality:

- Biome linting checks
- Code formatting validation
- TypeScript compilation checks

All checks must pass before commits are allowed. The "Madara-robot" handles automated code quality enforcement.

## MUI Typography Setup

The project uses Material-UI (MUI) with custom typography variants defined in `@supreme-int/design-system`.

### Structure

**Typography definition** (`packages/design-system/src/typography.ts`):

- Contains only the typography object export (no type declarations)
- All font sizes are in `rem` units (base browser size 16px)
- Uses `as const` for type safety

**Type declarations** (`packages/design-system/src/typography.d.ts`):

- Contains all `declare module` statements for MUI type augmentation
- Extends `@mui/material/styles` and `@mui/material/Typography`
- Must be in a separate `.d.ts` file

### Typography Variants

Available variants:

- `title1`: 18px (1.125rem), line-height 1.112, weight 500
- `title2`: 16px (1rem), line-height 1.25, weight 500
- `title3`: 14px (0.875rem), line-height 1.29, weight 500
- `body1`: 18px (1.125rem), line-height 1.11, weight 400
- `body2`: 16px (1rem), line-height 1.25, weight 400
- `body3`: 14px (0.875rem), line-height 1.29, weight 400

### Usage in Services

**Theme setup** (`services/*/src/shared/next/theme.ts`):

```tsx
"use client";
import { createTheme } from "@mui/material/styles";
import { typography } from "@supreme-int/design-system/src/typography";

const theme = createTheme({
  typography: {
    fontFamily: "var(--font-roboto)",
    ...typography,
  },
});

export default theme;
```

**Important**: Always use the full path `@supreme-int/design-system/src/typography` for imports, not the package export path.

**Using typography in components**:

```tsx
import { Typography } from '@mui/material';

<Typography variant="title1">Heading</Typography>
<Typography variant="body1">Body text</Typography>
```

### Package Configuration

**`packages/design-system/package.json`**:

- `@mui/material` must be in `dependencies` (not devDependencies)
- Export path: `"./typography": "./src/typography.ts"` (optional, direct import preferred)

## Imports types

Barrel imports from @supreme-int/\* packages are disabled! Dont use it
use direct imports like

```tsx
import { typography } from "@supreme-int/design-system/src/typography";
```
