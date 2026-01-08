import { AuthApi, RecipesApi, TOKEN_KEY, User } from '@supreme-int/api-client';
import { cookies } from 'next/headers';

const isProd = process.env.NODE_ENV === 'production';

function getBackendUrl(): string {
  if (!isProd) {
    return 'http://localhost:4000/main-api';
  }
  const backendNamespace = process.env.BACKEND_SERVICE_NAMESPACE ?? process.env.POD_NAMESPACE;
  return `http://backend.${backendNamespace}.svc.cluster.local/main-api`;
}

function getAuthBffUrl(): string {
  if (!isProd) {
    return 'http://localhost:4001/core-auth-bff';
  }
  const backendNamespace = process.env.BACKEND_SERVICE_NAMESPACE ?? process.env.POD_NAMESPACE;
  return `http://core-auth-bff.${backendNamespace}.svc.cluster.local/core-auth-bff`;
}

export const rscRecipesApi = new RecipesApi(getBackendUrl());
export const rscAuthApi = new AuthApi(getAuthBffUrl());

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value;
}

export async function getUser(): Promise<User | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    return await rscAuthApi.getCurrentUser(token);
  } catch {
    return null;
  }
}
