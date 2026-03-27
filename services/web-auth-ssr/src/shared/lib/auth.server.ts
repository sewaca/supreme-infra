import type { UserInfo } from '@supreme-int/api-client/src/generated/core-auth';
import { CoreAuth } from '@supreme-int/api-client/src/index';
import { cookies } from 'next/headers';
import { coreAuthClient } from '../api/clients';
import { TOKEN_KEY } from './auth.client';

export { getCoreAuthUrl } from './environment';

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value;
}

export async function getUser(): Promise<UserInfo | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const { data } = await CoreAuth.getMeAuthMeGet({
      client: coreAuthClient,
      headers: { Authorization: `Bearer ${token}` },
    });
    return data ?? null;
  } catch {
    return null;
  }
}
