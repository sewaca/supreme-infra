import { TOKEN_KEY } from '@supreme-int/lib/src/constants/auth.model';
import { cookies } from 'next/headers';

export async function getServerAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value;
}
