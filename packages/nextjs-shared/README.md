# @supreme-int/nextjs-shared

Shared utilities and middleware for Next.js applications in the supreme-infra monorepo.

## Features

- JWT authentication middleware factory
- FSD-compliant architecture

## Usage

### JWT Authentication Middleware

```typescript
import { createJwtAuthMiddleware } from '@supreme-int/nextjs-shared';

export const middleware = createJwtAuthMiddleware({
  cookieName: 'auth_token',
  loginUrl: '/login',
  publicRoutes: /^\/(login|register|public)/,
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

