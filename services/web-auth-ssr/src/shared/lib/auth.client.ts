import { TOKEN_KEY, type UserRole } from '@supreme-int/api-client/src/core-auth-bff';
import { CoreAuth } from '@supreme-int/api-client/src/index';
import { createClient, jsonBodySerializer } from '@supreme-int/api-client/src/generated/core-auth/client';
import type { AuthResponse, UserInfo } from '@supreme-int/api-client/src/generated/core-auth';

// Client-side calls go through ingress at /core-auth
const coreAuthBrowserClient = createClient({ baseUrl: '/core-auth', ...jsonBodySerializer });

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

export { detectClientInfo };

export async function login(data: {
  email: string;
  password: string;
  location?: string | null;
  device?: string | null;
  ip_address?: string | null;
}): Promise<AuthResponse> {
  const { data: result, error, response } = await CoreAuth.loginAuthLoginPost({
    client: coreAuthBrowserClient,
    body: data,
  });

  if (!response.ok || !result) {
    const detail = (error as { detail?: string } | undefined)?.detail;
    throw new Error(detail ?? 'Request failed');
  }

  return result;
}

// Костыль для совместимости: core-auth register не возвращает токен,
// поэтому после регистрации делаем auto-login.
export async function register(data: { email: string; password: string; name: string }): Promise<AuthResponse> {
  const { response, error } = await CoreAuth.registerAuthRegisterPost({
    client: coreAuthBrowserClient,
    body: data,
  });

  if (!response.ok) {
    const detail = (error as { detail?: string } | undefined)?.detail;
    throw new Error(detail ?? 'Request failed');
  }

  const { location, device, ip } = await detectClientInfo();
  return login({ email: data.email, password: data.password, location, device, ip_address: ip });
}

export async function getCurrentUser(token: string): Promise<UserInfo> {
  const { data, error, response } = await CoreAuth.getMeAuthMeGet({
    client: coreAuthBrowserClient,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok || !data) {
    const detail = (error as { detail?: string } | undefined)?.detail;
    throw new Error(detail ?? 'Request failed');
  }

  return data;
}

export async function deleteUser(_id: string, _token: string): Promise<void> {
  throw new Error('deleteUser is not supported by core-auth');
}
