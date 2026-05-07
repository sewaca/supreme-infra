import { decodeJwt } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { TOKEN_KEY } from '@supreme-int/lib/src/constants/auth.model';

export function getTokenFromCookies(cookieString: string): string | null {
  const tokenCookie = cookieString.split(';').find((c) => c.trim().startsWith(`${TOKEN_KEY}=`));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}

export function getUserFromToken(token: string | null): { name: string } | null {
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return { name: decoded.name };
}
