import { verifyJwt } from '@supreme-int/authorization-lib/src/jwt/verify-jwt';
import { checkSession } from '@supreme-int/authorization-lib/src/session/check-session';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export type AuthLevel = 'none' | 'valid';

export interface AuthRoute {
  path: RegExp;
  auth_level: AuthLevel;
}

const COOKIE_NAME = 'auth_token';
const LOGIN_URL = '/login';

type Props = {
  routes: AuthRoute[];
};

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL(LOGIN_URL, request.url);
  return NextResponse.redirect(loginUrl);
}

export function createRouteAuthMiddleware({ routes }: Props) {
  return async function middleware(request: NextRequest, _event: NextFetchEvent): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    const matched = routes.find((r) => r.path.test(pathname));
    const authLevel = matched?.auth_level ?? 'none';

    if (authLevel === 'none') {
      return NextResponse.next();
    }

    // auth_level === 'valid': JWT verify + session check
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return redirectToLogin(request);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[auth-middleware] JWT_SECRET is not set');
      return NextResponse.next();
    }

    const { valid, durationMs: jwtMs } = await verifyJwt({ token, secret: jwtSecret });
    if (!valid) {
      console.log(`[auth-middleware] JWT invalid (${jwtMs.toFixed(1)}ms) path=${pathname}`);
      return redirectToLogin(request);
    }

    const coreAuthUrl = process.env.CORE_AUTH_URL ?? 'http://core-auth.default.svc.cluster.local/core-auth';
    const { status, durationMs: sessionMs } = await checkSession({ token, coreAuthUrl });

    console.log(
      `[auth-middleware] JWT=${jwtMs.toFixed(1)}ms session=${sessionMs.toFixed(1)}ms status=${status} path=${pathname}`,
    );

    if (status === 'revoked' || status === 'expired' || status === 'invalid') {
      return redirectToLogin(request);
    }

    // status === 'valid' or 'error' (fail-open on core-auth outage)
    return NextResponse.next();
  };
}
