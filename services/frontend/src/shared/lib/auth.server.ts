import type { UserInfo } from '@supreme-int/api-client/src/generated/core-auth';
import { RecipesApi, TOKEN_KEY } from '@supreme-int/api-client/src/index';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/createServerFetch';
import { cookies } from 'next/headers';

const isProd = process.env.NODE_ENV === 'production';

function getBackendUrl(): string {
  if (!isProd) {
    return 'http://localhost:4000/core-recipes-bff';
  }
  const backendNamespace = process.env.BACKEND_SERVICE_NAMESPACE ?? process.env.POD_NAMESPACE;
  return `http://core-recipes-bff.${backendNamespace}.svc.cluster.local/core-recipes-bff`;
}

function getCoreAuthUrl(): string {
  if (!isProd) {
    return 'http://localhost:8002/core-auth';
  }
  const namespace = process.env.BACKEND_SERVICE_NAMESPACE ?? process.env.POD_NAMESPACE;
  return `http://core-auth.${namespace}.svc.cluster.local/core-auth`;
}

export const rscRecipesApi = new RecipesApi(getBackendUrl(), createServerFetch());

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value;
}

export async function getUser(): Promise<UserInfo | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${getCoreAuthUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json() as Promise<UserInfo>;
  } catch {
    return null;
  }
}
