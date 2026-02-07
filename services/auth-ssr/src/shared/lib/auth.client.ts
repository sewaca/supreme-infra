import { AuthApi, DecodedToken, TOKEN_KEY, UserRole } from '@supreme-int/api-client/src/index';

const isProd = process.env.NODE_ENV === 'production';

function getAuthBffUrl(): string {
  return '/core-auth-bff';
  // TODO: fix for a while
  // const host = isProd ? '84.252.134.216' : 'localhost:4000';
  // return `http://${host}/core-auth-bff`;
}

export const clientAuthApi = new AuthApi(getAuthBffUrl());

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

  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks universal browser support
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function removeAuthToken(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks universal browser support
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
