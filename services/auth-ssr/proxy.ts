import { createJwtAuthMiddleware } from '@supreme-int/nextjs-shared/src/shared/jwt/createJwtAuthMiddleware';
import { chain } from '@supreme-int/nextjs-shared/src/shared/middleware/chain';

export const proxy = chain([createJwtAuthMiddleware({ publicRoutes: /^\/(login|register)/ })]);

export const config = {
  matcher: ['/((?!api|auth-ssr/_next|favicon.ico).*)'],
};
