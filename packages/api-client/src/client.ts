import { RecipesApi } from './backend';
import { AuthApi } from './core-auth-bff';
import { type DecodedToken, TOKEN_KEY, type UserRole } from './types';

export type { DecodedToken, UserRole } from './types';

const isProd = process.env.NODE_ENV === 'production';

function getBackendUrl(): string {
  const host = isProd ? '84.252.134.216' : 'localhost:4000';
  return `http://${host}/main-api`;
}

function getAuthBffUrl(): string {
  const host = isProd ? '84.252.134.216' : 'localhost:4000';
  return `http://${host}/core-auth-bff`;
}

export const recipesApi = new RecipesApi(getBackendUrl());
export const authApi = new AuthApi(getAuthBffUrl());

export function getAuthToken(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith(`${TOKEN_KEY}=`));

  if (!tokenCookie) {
    return undefined;
  }

  return tokenCookie.split('=')[1];
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64WithPadding = base64 + padding;
  return atob(base64WithPadding);
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded) as DecodedToken;
  } catch {
    return null;
  }
}

export function getUserRole(): UserRole | null {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const decoded = decodeToken(token);
  return decoded?.role ?? null;
}

export function setAuthToken(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function removeAuthToken(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
