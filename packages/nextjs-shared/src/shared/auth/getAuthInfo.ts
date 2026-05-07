import { decodeJwt } from '@supreme-int/authorization-lib/src/jwt/decode-jwt';
import { TOKEN_KEY } from '@supreme-int/lib/src/constants/auth.model';
import { cookies } from 'next/headers';

export async function getAuthInfo() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value ?? null;
  const decoded = token ? decodeJwt(token) : null;
  return {
    userId: decoded?.sub ?? null,
    role: decoded?.role ?? null,
    name: decoded?.name ?? null,
    token,
  };
}
