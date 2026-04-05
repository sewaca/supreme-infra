import { createRouteAuthMiddleware } from '@supreme-int/nextjs-shared/src/shared/middleware/createRouteAuthMiddleware';
import { authRoutes } from './_auth-routes.generated';

export const proxy = createRouteAuthMiddleware({ routes: authRoutes });

export const config = {
  matcher: ['/((?!api|web-documents-ssr/_next|favicon.ico).*)'],
};
