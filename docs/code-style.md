# Руководство по стилю кода

Этот документ содержит исчерпывающую информацию о стандартах кодирования, соглашениях и лучших практиках, используемых в монопрепозитории supreme-infra.

## Содержание

- [Конфигурация Biome](#biome-configuration)
- [Конфигурация TypeScript](#typescript-configuration)
- [Структура проекта](#project-structure)
- [Соглашения по именованию](#naming-conventions)
- [React компоненты](#react-components)
- [Backend (NestJS)](#backend-nestjs)
- [Паттерны API слоя](#api-layer-patterns)
- [Руководство по тестированию](#testing-guidelines)
- [Организация импортов](#import-organization)
- [Скрипты и команды](#scripts-and-commands)

## Конфигурация Biome

Располагается в `biome.json`:

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

**Основные правила:**

- Отступы: 2 пробела
- Одинарные кавычки для JS/TS, двойные для JSX
- Включены рекомендуемые правила линтинга
- `useImportType` отключено (позволяет `import type` при необходимости)

## Конфигурация TypeScript

Базовая конфигурация в `tsconfig.base.json`:

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

**Основные настройки:**

- Строгий режим включен
- Запрещены неиспользуемые переменные/параметры
- Запрещены неявные возвраты или переопределения
- Явные типы обязательны везде

## Структура проекта

Следует архитектуре **Feature-Sliced Design**:

```
services/
├── backend/                      # Сервис NestJS
│   ├── src/
│   │   ├── app.controller.spec.ts
│   │   ├── app.module.ts
│   │   ├── features/             # Бизнес-функции
│   │   │   └── Posts/
│   │   │       ├── Posts.controller.spec.ts
│   │   │       ├── Posts.controller.ts
│   │   │       ├── Posts.module.ts
│   │   │       └── Posts.service.spec.ts
│   │   │       └── Posts.service.ts
│   │   └── shared/               # Общие утилиты
│   │       └── api/
│   │           └── jsonplaceholderDatasource.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
└── frontend/                     # Сервис Next.js
    ├── src/
    │   ├── app/                  # Next.js app router
    │   │   ├── [id]/
    │   │   │   └── page.tsx
    │   │   ├── api/
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── entities/             # Бизнес-сущности
    │   │   └── post/
    │   │       ├── PostCard.module.css
    │   │       ├── PostCard.spec.tsx
    │   │       └── PostCard.tsx
    │   ├── features/             # Компоненты функций
    │   ├── shared/               # Общие утилиты
    │   │   └── api/
    │   │       └── backendApi.ts
    │   ├── views/                # Компоненты страниц
    │   │   └── PostDetailsPage/
    │   │       └── index.tsx
    │   └── widgets/              # UI компоненты
    │       └── Breadcrumbs/
    │           └── index.tsx
    ├── next.config.ts
    ├── package.json
    └── vitest.config.ts
```

## Соглашения по именованию

### Файлы и директории

- **Компоненты**: PascalCase (`PostCard.tsx`, `PostsController.ts`)
- **Утилиты**: camelCase (`backendApi.ts`, `jsonplaceholderDatasource.ts`)
- **CSS модули**: kebab-case (`PostCard.module.css`)
- **Файлы тестов**: То же имя, что и тестируемый файл + `.spec.ts/tsx`

### Элементы кода

- **Классы/Интерфейсы/Типы**: PascalCase (`PostsController`, `PostSummary`)
- **Переменные/Функции/Методы**: camelCase (`getPostsSummary()`, `postId`)
- **Константы**: UPPER_SNAKE_CASE (`BASE_URL`)
- **Приватные методы**: camelCase с маленькой буквы (`countCommentsByPostId()`)

## React компоненты

**Функциональные компоненты** с TypeScript интерфейсами:

```tsx
interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/${post.id}`} className={styles.card}>
      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.body}>{post.body}</p>
      <div className={styles.commentsCount}>Комментарии: {post.commentsCount}</div>
    </Link>
  );
}
```

**Основные паттерны:**

- Предпочитаются именованные экспорты
- Интерфейсы пропсов определяются над компонентом
- CSS модули для стилизации
- Ранние возвраты для условного рендеринга

## Backend (NestJS)

### Контроллеры

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

### Сервисы

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

**Основные паттерны:**

- Внедрение зависимостей для сервисов
- Явные типы возврата
- Приватные методы для внутренней логики
- Async/await вместо промисов
- Ранняя валидация и обработка ошибок

## Паттерны API слоя

### Backend API клиент (Singleton)

```ts
export interface PostSummary {
  userId: number;
  id: number;
  title: string;
  body: string;
  commentsCount: number;
}

class BackendApi {
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  }

  private static instance: BackendApi | null = null;

  public static getInstance(): BackendApi {
    if (!BackendApi.instance) {
      BackendApi.instance = new BackendApi();
    }
    return BackendApi.instance;
  }

  public async getPostsSummary(userId?: number): Promise<PostSummary[]> {
    const url = userId ? `${this.baseUrl}/posts/get-summary?userId=${userId}` : `${this.baseUrl}/posts/get-summary`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return response.json() as Promise<PostSummary[]>;
  }

  public async getPostDetails(postId: number): Promise<PostDetails> {
    const url = `${this.baseUrl}/posts/${postId}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Post not found");
      }
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json() as Promise<PostDetails>;
  }
}

export const backendApi = BackendApi.getInstance();
```

### Внешние API источники данных

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

## Руководство по тестированию

### Unit тесты с Vitest

**Конфигурация** (`vitest.config.global.ts`):

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

**Пример теста Backend сервиса**:

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
  });
});
```

**Пример теста Frontend компонента**:

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

**Основные принципы тестирования:**

- Мокировать ВСЕ внешние зависимости
- Писать моки в однострочном формате
- Использовать описательные имена тестов
- Следовать паттерну AAA (Arrange, Act, Assert)
- Тестировать как успешные, так и случаи ошибок
- Использовать `beforeEach` для настройки тестов

**Команды для тестирования**:

```bash
# Запуск unit тестов для конкретного сервиса
cd services/backend && pnpm run unit --verbose
cd services/frontend && pnpm run unit --verbose
```

## Организация импортов

**Группировка и порядок импортов**:

1. **Внешние библиотеки** (React, NestJS, библиотеки тестирования)
2. **Внутренние общие модули** (из shared/)
3. **Относительные импорты** (родительские/дочерние директории)
4. **Импорты типов** (при необходимости)

**Примеры**:

Backend сервис:

```ts
import { Injectable } from "@nestjs/common";
import { Comment, JsonplaceholderDatasource } from "../../shared/api/jsonplaceholderDatasource";
import { PostsService } from "./Posts.service";
```

Frontend компонент:

```tsx
import Link from "next/link";
import { PostSummary } from "../../shared/api/backendApi";
import styles from "./PostCard.module.css";
```

Файл теста:

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostSummary } from "../../shared/api/backendApi";
import { PostCard } from "./PostCard";
```

## Скрипты и команды

**Команды корневого уровня** (`package.json`):

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

**Управление пакетами**:

- Используется `pnpm` как менеджер пакетов
- Требуется Node.js версии 22
- Требуется pnpm версии 9

**Доступные команды**:

```bash
pnpm lint              # Запуск Biome линтинга
pnpm format            # Запуск Biome форматирования (авто-исправление)
pnpm generate:router   # Генерация конфигурации роутера сервиса
pnpm generate:overrides # Генерация Helm overrides для сервисов
pnpm generate          # Запуск всех генераторов
```

## Pre-commit хуки

Проект использует pre-commit хуки для обеспечения качества кода:

- Проверки Biome линтинга
- Валидация форматирования кода
- Проверки компиляции TypeScript

Все проверки должны пройти перед разрешением коммитов. "Madara-robot" занимается автоматизированным обеспечением качества кода.
