import { createRouteAuthMiddleware } from '@supreme-int/nextjs-shared/src/shared/middleware/create-route-auth-middleware';
import { authRoutes } from './_auth-routes.generated';

export const proxy = createRouteAuthMiddleware({ routes: authRoutes });

export const config = {
  matcher: ['/((?!api|web-profile-ssr/_next|favicon.ico).*)'],
};
