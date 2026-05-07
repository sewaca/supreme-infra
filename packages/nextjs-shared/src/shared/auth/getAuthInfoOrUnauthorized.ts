import { decodeJwt } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { TOKEN_KEY } from '@supreme-int/lib/src/constants/auth.model';
import { cookies } from 'next/headers';
import { unauthorized } from 'next/navigation';

export async function getAuthInfoOrUnauthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value ?? null;
  const decoded = token ? decodeJwt(token) : null;

  if (!decoded) {
    unauthorized();
  }

  return {
    userId: decoded.sub,
    role: decoded.role,
    name: decoded.name,
    token,
  };
}
