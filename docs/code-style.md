# Руководство по стилю кода

Этот документ описывает стандарты кодирования, соглашения и практики монорепозитория supreme-infra. Раздел про Next.js SSR опирается на реальный код сервисов **web-profile-ssr** и **web-documents-ssr**.

## Содержание

- [Конфигурация Biome](#конфигурация-biome)
- [Prettier и согласованность с Biome](#prettier-и-согласованность-с-biome)
- [Конфигурация TypeScript](#конфигурация-typescript)
- [Структура проекта](#структура-проекта)
- [Next.js SSR (web-profile-ssr, web-documents-ssr)](#nextjs-ssr-web-profile-ssr-web-documents-ssr)
- [Соглашения по именованию](#соглашения-по-именованию)
- [React компоненты](#react-компоненты)
- [Backend (NestJS)](#backend-nestjs)
- [Паттерны API слоя](#паттерны-api-слоя)
- [Руководство по тестированию](#руководство-по-тестированию)
- [Организация импортов](#организация-импортов)
- [Скрипты и команды](#скрипты-и-команды)
- [Pre-commit хуки](#pre-commit-хуки)

## Конфигурация Biome

Файл в корне: `biome.json`. Актуальное содержимое лучше смотреть в репозитории; ниже — смысловые опоры.

**Форматирование:**

- Отступы: 2 пробела, пробелы, не табы
- Максимальная ширина строки: **120**
- JavaScript/TypeScript: одинарные кавычки; JSX: двойные кавычки
- JSON: те же отступы и `lineWidth: 120`, комментарии в JSON разрешены, хвостовые запятые в JSON — нет

**Линтер:**

- Включены рекомендуемые правила
- Домены **next** и **react** — recommended
- `style/useImportType` — **off** (не навязывать отдельный стиль `import type` там, где команда использует обычный импорт)
- Рекомендации **a11y** в Biome отключены (`recommended: false`) — доступность не дублируется линтером Biome в этой конфигурации
- `performance/noImgElement` — off (допускается `<img>` там, где это принято в проекте)
- `complexity/noImportantStyles` — off

**Прочее:**

- Учитывается `.gitignore` для исключения файлов
- Игнорируются сгенерированные и отчётные пути (например `packages/api-client/src/generated`, `__reports`)
- В assist включена организация импортов (`organizeImports`: on)
- Для декораторов параметров в JS-парсере включён флаг, нужный NestJS и аналогам

## Prettier и согласованность с Biome

Файл `.prettierrc.json` задаёт **`printWidth: 120`**, **`tabWidth: 2`**, **`useTabs: false`**, **`semi: true`**, **`singleQuote: false`**, **`trailingComma: "es5"`**, **`endOfLine: "lf"`**, **`arrowParens: "always"`**, **`bracketSpacing: true`**, **`proseWrap: "preserve"`**. Есть `overrides` для `*.yaml`, `*.yml`, `*.md`.

**Важно:** TypeScript/JavaScript/React в репозитории форматирует и проверяет **Biome** (`pnpm run format:biome` / `pnpm run lint:ts`). **Prettier** в корне вызывается отдельно для файлов `md`, `yaml`, `yml` (скрипт `format:prettier`) — ширина строки и отступы согласованы с Biome, но стиль кавычек в Prettier (`singleQuote: false`) не является каноном для `.ts`/`.tsx`; для кода ориентир — **Biome** (одинарные в TS/JS, двойные в JSX).

## Конфигурация TypeScript

База: `tsconfig.base.json` (строгий режим, `noUnusedLocals` / `noUnusedParameters`, `noImplicitReturns`, и т.д.). Алиасы пакетов монорепозитория: `@supreme-int/*` → `packages/*`.

SSR-приложения расширяют `tsconfig.ssr.json`: `jsx: "preserve"`, плагин Next, `typescript-plugin-css-modules` для перехода к определениям в CSS-модулях, `baseUrl: "."` (корень монорепозитория при работе из сервиса), `allowJs`, `isolatedModules`.

**Практика:** в строгом режиме типы обязательны там, где TypeScript их требует; для пропсов компонентов и DTO удобно явно описывать формы данных (`type` / `interface`, `export type` для сущностей). Не обязательно дублировать явный возврат у каждой маленькой функции, если вывод типов однозначен.

## Структура проекта

Используется **Feature-Sliced Design** в `src/` SSR-сервисов: **entities**, **views**, **widgets**, **shared**. Маршруты и точки входа Next — в **`app/`**.

### SSR-сервисы (пример web-profile-ssr)

```
services/web-profile-ssr/
├── app/                          # App Router
│   ├── layout.tsx
│   ├── api/                      # route handlers (например status)
│   └── profile/                  # сегменты маршрутов, page.tsx, actions.ts
├── src/
│   ├── entities/                 # модели и типы предметной области
│   ├── views/                    # страничные композиции (ProfilePage, SettingsPage, …)
│   ├── widgets/                  # крупные блоки UI (карточки, списки, навбар)
│   └── shared/                   # api, hooks, lib, theme
├── proxy.ts                      # middleware (экспорт proxy + config.matcher)
├── _auth-routes.generated.ts     # сгенерированные защищённые маршруты
├── next.config.ts
└── package.json
```

### web-documents-ssr

Та же схема, узкий домен: страницы в `app/documents/…`, виджеты (например зачётка, студенческий), общий `shared/api`, `layout` с MUI и шрифтами. Переходы из профиля на документы идут обычными путями вида `/documents/gradebook`.

### Прочие сервисы

Шаблон с **backend** (NestJS) и условным **frontend** из старых примеров остаётся валидным для других частей монорепозитория: `features/` в Nest, FSD в клиентах.

## Next.js SSR (web-profile-ssr, web-documents-ssr)

**Страницы (`app/.../page.tsx`):**

- Часто `export const dynamic = 'force-dynamic'` для данных с сервера
- Асинхронный default export или `async function Page()` — загрузка данных, вызовы `@supreme-int/api-client`, затем рендер view из `src/views/...`
- Импорты из кода сервиса из `app/` — абсолютные от корня репозитория: `services/web-<name>-ssr/src/...`

**Server Actions:**

- В начале файла `'use server'` при необходимости; у отдельных экспортов встречается повтор `'use server'` в теле функции
- Результаты в виде `{ success, error?, ... }`, пользовательские тексты через `i18n(...)` из `@supreme-int/i18n`
- Ошибки API обрабатываются через `response.ok`, коды статуса, узкие проверки `detail` от клиента

**API routes:**

- `NextResponse.json(...)`, явный тип возврата у handler’а при необходимости (`Promise<NextResponse>`)

**Proxy / auth:**

- `proxy.ts` экспортирует `proxy` из `@supreme-int/nextjs-shared` и `config.matcher` с исключениями для `api`, `/_next`, статики

**Стек UI:**

- MUI (`@mui/material`, иконки), `@supreme-int/design-system`, глобальные стили и переменные дизайн-системы в `layout`
- Стили страниц/виджетов — **CSS modules** (`*.module.css`) рядом с компонентом

**Связь сервисов:**

- UI профиля ссылается на маршруты другого приложения (`/documents/...`) — это нормальная схема при раздельном деплое страниц при общем ingress

## Соглашения по именованию

### Файлы и директории

- **Компоненты и страницы-вью**: PascalCase каталог и файл (`ProfilePage.tsx`, `DefaultNavbar/`)
- **Утилиты и API-клиенты**: camelCase (`getUserId.ts`, `clients.ts`, `environment.ts`)
- **Вспомогательные хуки в подпапках lib**: иногда kebab-case (`use-drag-and-drop.ts`)
- **CSS modules**: рядом с компонентом, обычно `ComponentName.module.css`
- **Тесты**: суффикс `.spec.ts` / `.spec.tsx`

### Элементы кода

- **Типы/интерфейсы для домена**: PascalCase; публичные формы сущностей — `export type` в файлах вроде `ProfileData.ts`
- **Компоненты**: PascalCase, именованный экспорт
- **Переменные и функции**: camelCase
- **Константы**: по смыслу — UPPER_SNAKE_CASE для truly-constant конфигов; локальные данные — camelCase

## React компоненты

**Функциональные компоненты**, пропсы через `type Props = { ... }` или интерфейс, если так принято в файле:

```tsx
type Props = { data: ProfileData };

export const ProfilePage = ({ data }: Props) => {
  return (
    <Paper sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }} elevation={0}>
      <DefaultNavbar rightSlot={<LogoutButton />} position="absolute" />
      {/* … */}
    </Paper>
  );
};
```

**Паттерны:**

- Именованные экспорты для view/widget
- Условный рендер через тернарники или ранние возвраты там, где читаемость лучше
- Тексты для пользователя — `i18n('…')`
- Для списков и сеток — компоненты дизайн-системы (`Row`, `Spacer`, …) и при необходимости `sx` у MUI

## Backend (NestJS)

(Без изменений по смыслу — см. примеры контроллеров/сервисов в документации к вашему модулю backend.)

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

**Паттерны:**

- Внедрение зависимостей
- Явные типы возврата публичных методов
- Приватные методы для внутренней логики
- Async/await
- Ранняя валидация и исключения с понятными сообщениями

## Паттерны API слоя

Клиенты OpenAPI в SSR: настройка `createServerFetch` из `@supreme-int/nextjs-shared`, `baseUrl` из `shared/lib/environment`, экспорт настроенного клиента из `shared/api/clients.ts`. Вызовы — через сгенерированные методы `@supreme-int/api-client` (`CoreClientInfo.*`, `CoreAuth.*`, …) с передачей `client` в параметрах.

Пример внешнего datasource в Nest (jsonplaceholder) остаётся справочным для backend.

## Руководство по тестированию

### Unit тесты с Vitest

Конфигурация наследуется от общих паттернов монорепозитория (`vitest.config.global.ts` и локальный `vitest.config.ts` сервиса).

**Принципы:**

- Мокать все внешние зависимости (сеть, Next, клиенты)
- По договорённости команды простые объекты-моки можно писать **в одну строку**
- Имена тестов — описательные; структура AAA

**Команды:**

```bash
cd services/web-profile-ssr && pnpm run unit --verbose
cd services/web-documents-ssr && pnpm run unit --verbose
```

## Организация импортов

Рекомендуемый порядок (Biome может переупорядочить при organize imports):

1. **Стандартные и внешние пакеты** (`next`, `react`, `@mui/...`)
2. **Внутренние пакеты монорепозитория** (`@supreme-int/...`)
3. **Абсолютные пути сервиса** из `app/`: `services/web-<service>-ssr/src/...`
4. **Относительные импорты** внутри `src/` (`../../entities/...`, `./ProfilePage.module.css`)

Типы из сущностей в `app/` при необходимости: `import type { ... } from 'services/.../entities/...'`.

**Пример страницы:**

```tsx
import { CoreClientInfo } from "@supreme-int/api-client/src/index";
import type { ProfileData } from "services/web-profile-ssr/src/entities/Profile/ProfileData";
import { coreClientInfoClient } from "services/web-profile-ssr/src/shared/api/clients";
import { getMockedUserId } from "services/web-profile-ssr/src/shared/api/getUserId";
import { ProfilePage } from "services/web-profile-ssr/src/views/ProfilePage/ProfilePage";
```

**Пример view:**

```tsx
import { Paper, Typography } from "@mui/material";
import { Row } from "@supreme-int/design-system/src/components/Row/Row";
import { i18n } from "@supreme-int/i18n/src/i18n";
import { ProfileData } from "../../entities/Profile/ProfileData";
import { DefaultNavbar } from "../../widgets/DefaultNavbar/DefaultNavbar";
import styles from "./ProfilePage.module.css";
```

## Скрипты и команды

Корневой `package.json` (смысл; точные команды смотрите в файле):

- **`pnpm lint`** — `lint:ts` (Biome `check --write`) и `lint:deps` (валидация зависимостей), плюс при необходимости линтеры других языков
- **`pnpm format`** — `format:biome` (Biome `check --fix`), **`format:prettier`** для `md`/`yaml`/`yml`, при необходимости формат Python (ruff)

Генерация: `pnpm generate`, `pnpm generate:router`, `pnpm generate:api-client`, `pnpm generate:overrides`, `pnpm generate:service` и др. — см. актуальный `package.json`.

Требования к окружению задаются в корневом `package.json` (`engines`: например Node и версия **pnpm**).

```bash
pnpm lint              # полная проверка согласно корневым скриптам
pnpm run lint:ts       # только Biome по TS/JS/JSON и т.д.
pnpm format            # Biome + Prettier (md/yaml) + прочее по скриптам
pnpm run format:biome  # только Biome с автоисправлением
pnpm run format:prettier  # только Prettier для md/yaml/yml
```

## Pre-commit хуки

Pre-commit запускает проверки качества (в т.ч. Biome и типизацию — по настройке репозитория). Перед коммитом желательно локально выполнить `pnpm lint` и `pnpm format` (или минимум `pnpm run lint:ts` и `pnpm run format:biome` для правок только в TS/JS).
