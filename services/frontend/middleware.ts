import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  console.log('token is', token);
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.includes(pathname);

  if (!token && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // if (token && isAuthRoute) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
