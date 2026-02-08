// @ts-nocheck FIXME:

import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { createJwtAuthMiddleware } from './createJwtAuthMiddleware';

vi.mock('../../../shared', () => ({ verifyJwt: vi.fn() }));

const { verifyJwt } = await import('..');

describe.skip('createJwtAuthMiddleware', () => {
  it('should allow access to public routes without token', async () => {
    const middleware = createJwtAuthMiddleware({
      cookieName: 'auth_token',
      loginUrl: '/login',
      publicRoutes: /^\/(login|register)/,
    });
    const request = new NextRequest(new URL('http://localhost/login'));
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('should redirect to login when no token and not public route', async () => {
    const middleware = createJwtAuthMiddleware({
      cookieName: 'auth_token',
      loginUrl: '/login',
      publicRoutes: /^\/(login|register)/,
    });
    const request = new NextRequest(new URL('http://localhost/dashboard'));
    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('location')).toContain('from=%2Fdashboard');
  });

  it('should allow access with valid token when jwtSecret provided', async () => {
    vi.mocked(verifyJwt).mockResolvedValue(true);
    const middleware = createJwtAuthMiddleware({
      cookieName: 'auth_token',
      loginUrl: '/login',
      publicRoutes: /^\/(login|register)/,
      jwtSecret: 'secret',
    });
    const request = new NextRequest(new URL('http://localhost/dashboard'));
    request.cookies.set('auth_token', 'valid-token');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('should redirect to login with invalid token when jwtSecret provided', async () => {
    vi.mocked(verifyJwt).mockResolvedValue(false);
    const middleware = createJwtAuthMiddleware({
      cookieName: 'auth_token',
      loginUrl: '/login',
      publicRoutes: /^\/(login|register)/,
      jwtSecret: 'secret',
    });
    const request = new NextRequest(new URL('http://localhost/dashboard'));
    request.cookies.set('auth_token', 'invalid-token');
    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('should allow access with token when no jwtSecret provided', async () => {
    const middleware = createJwtAuthMiddleware({
      cookieName: 'auth_token',
      loginUrl: '/login',
      publicRoutes: /^\/(login|register)/,
    });
    const request = new NextRequest(new URL('http://localhost/dashboard'));
    request.cookies.set('auth_token', 'any-token');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });
});
