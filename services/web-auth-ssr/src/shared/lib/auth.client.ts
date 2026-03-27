import { TOKEN_KEY, type UserRole } from '@supreme-int/api-client/src/core-auth-bff';
import type { AuthResponse, UserInfo } from '@supreme-int/api-client/src/generated/core-auth';

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

type ClientInfo = { location: string | null; device: string | null; ip: string | null };

async function detectClientInfo(): Promise<ClientInfo> {
  try {
    const response = await fetch('https://api.ipregistry.co/?key=tryout');
    const payload = await response.json();
    const country = payload?.location?.country?.name as string | undefined;
    const city = payload?.location?.city as string | undefined;
    const locationParts = [country, city].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : null;
    const device = (payload?.user_agent?.device?.name as string | undefined) ?? null;
    const ip = (payload?.ip as string | undefined) ?? null;
    return { location, device, ip };
  } catch {}
  let location: string | null = null;
  try {
    location = Intl.DateTimeFormat().resolvedOptions().timeZone?.split('/')?.join(', ');
  } catch {}
  return { location, device: null, ip: null };
}

export async function login(data: {
  email: string;
  password: string;
  location?: string | null;
  device?: string | null;
  ip_address?: string | null;
}): Promise<AuthResponse> {
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
  const { location, device, ip } = await detectClientInfo();
  return login({ email: data.email, password: data.password, location, device, ip_address: ip });
}

export { detectClientInfo };

export async function getCurrentUser(token: string): Promise<UserInfo> {
  return callCoreAuth<UserInfo>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteUser(_id: string, _token: string): Promise<void> {
  throw new Error('deleteUser is not supported by core-auth');
}
