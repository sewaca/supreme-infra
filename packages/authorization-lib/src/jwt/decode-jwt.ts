export const TOKEN_KEY = 'auth_token';

export type DecodedToken = {
  sub: string;
  jti?: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
};

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(base64 + padding);
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as DecodedToken;
  } catch {
    return null;
  }
}

export function getTokenFromCookies(cookieString: string): string | null {
  const tokenCookie = cookieString.split(';').find((c) => c.trim().startsWith(`${TOKEN_KEY}=`));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}
