import type { NextProxy, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyJwt as verifyJwtSafe } from './verifyJwt';

const LOGIN_URL = '/login';
const COOKIE_NAME = 'auth_token';

type Props = { publicRoutes?: RegExp };

export function createJwtAuthMiddleware({ publicRoutes }: Props): NextProxy {
  return async function middleware(request: NextRequest) {
    const redirectToLogin = () => {
      const loginUrl = new URL(LOGIN_URL, request.url);
      // loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    };

    const isPublicRoute = publicRoutes ? publicRoutes.test(request.nextUrl?.pathname) : false;
    if (isPublicRoute) {
      return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return redirectToLogin();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return NextResponse.next();
    }

    const isValid = await verifyJwtSafe({ token, secret });
    if (!isValid) {
      return redirectToLogin();
    }

    return NextResponse.next();
  };
}
