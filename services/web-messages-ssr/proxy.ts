import { createRouteAuthMiddleware } from '@supreme-int/nextjs-shared/src/shared/middleware/create-route-auth-middleware';
import { NextResponse } from 'next/server';
import { authRoutes } from './_auth-routes.generated';

// export const proxy = createRouteAuthMiddleware({ routes: authRoutes });
export const proxy = () => {
  return NextResponse.next();
};

export const config = {
  matcher: ['/((?!api|web-messages-ssr/_next|favicon.ico).*)'],
};
