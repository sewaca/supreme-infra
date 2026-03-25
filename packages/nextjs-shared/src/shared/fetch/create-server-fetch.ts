import { cookies } from 'next/headers';

const TOKEN_KEY = 'auth_token';

/**
 * Creates a fetch function for server-side (SSR/RSC/Server Actions) use that:
 * - Automatically injects Authorization: Bearer <token> from the auth_token cookie
 *   (only if Authorization header is not already set by the caller)
 * - Logs every request with console.time/console.timeEnd
 *
 * Usage: pass the result to hey-api client.setConfig({ fetch: createServerFetch() })
 * or to BaseApi constructor.
 */
export function createServerFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (
      (init?.method ?? (input instanceof Request ? input.method : undefined) ?? 'GET') as string
    ).toUpperCase();
    const label = `${method} ${url}`;

    console.time(label);
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(TOKEN_KEY)?.value;

      const headers = new Headers(init?.headers);
      if (token && !headers.has('authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await globalThis.fetch(input, { ...init, headers });
      console.timeEnd(label);
      return response;
    } catch (error) {
      console.timeEnd(label);
      throw error;
    }
  };
}
