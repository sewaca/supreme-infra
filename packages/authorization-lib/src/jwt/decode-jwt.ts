import { TOKEN_KEY } from '@supreme-int/lib/src/constants/auth.model';
import { type DecodedToken, decodedTokenSchema } from './token-schema';

export type { DecodedToken } from './token-schema';

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(base64 + padding);
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const result = decodedTokenSchema.safeParse(JSON.parse(base64UrlDecode(parts[1])));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function getTokenFromCookies(cookieString: string): string | null {
  const tokenCookie = cookieString.split(';').find((c) => c.trim().startsWith(`${TOKEN_KEY}=`));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}
