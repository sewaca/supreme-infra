export const TOKEN_KEY = 'auth_token';

interface DecodedToken {
  sub: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64WithPadding = base64 + padding;
  return atob(base64WithPadding);
}

export function decodeJwt(token: string): DecodedToken | null {
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

export function getTokenFromCookies(cookieString: string): string | null {
  const cookies = cookieString.split(';');
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith(`${TOKEN_KEY}=`));

  if (!tokenCookie) {
    return null;
  }

  return tokenCookie.split('=')[1];
}

export function getUserFromToken(token: string | null): { name: string } | null {
  if (!token) {
    return null;
  }

  const decoded = decodeJwt(token);
  if (!decoded) {
    return null;
  }

  return {
    name: decoded.name,
  };
}

