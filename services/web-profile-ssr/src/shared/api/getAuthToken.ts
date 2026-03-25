import { TOKEN_KEY } from '@supreme-int/api-client/src/core-auth-bff';
import { cookies } from 'next/headers';

export async function getServerAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value;
}
