import { chain } from '@supreme-int/nextjs-shared/src/shared/middleware/chain';

export const proxy = chain([
  //createJwtAuthMiddleware({})
]);

export const config = {
  matcher: ['/((?!api|web-profile-ssr/_next|favicon.ico).*)'],
};
