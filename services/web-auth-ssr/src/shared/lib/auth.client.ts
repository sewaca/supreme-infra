import type { AuthResponse, UserInfo } from '@supreme-int/api-client/src/core-auth';
import { TOKEN_KEY, type UserRole } from '@supreme-int/api-client/src/core-auth-bff';

// Client-side calls go through ingress at /core-auth
const AUTH_URL = '/core-auth';

export { TOKEN_KEY };
export type { UserRole };

// ─── Token helpers ────────────────────────────────────────────────────────────

export type DecodedToken = {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
};

export function setAuthToken(token: string): void {
  if (typeof document === 'undefined') return;
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks universal browser support
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function removeAuthToken(): void {
  if (typeof document === 'undefined') return;
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks universal browser support
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function callCoreAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_URL}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export async function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return callCoreAuth<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Костыль для совместимости: core-auth register не возвращает токен,
// поэтому после регистрации делаем auto-login.
export async function register(data: { email: string; password: string; name: string }): Promise<AuthResponse> {
  await callCoreAuth('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return login({ email: data.email, password: data.password });
}

export async function getCurrentUser(token: string): Promise<UserInfo> {
  return callCoreAuth<UserInfo>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteUser(_id: string, _token: string): Promise<void> {
  throw new Error('deleteUser is not supported by core-auth');
}
