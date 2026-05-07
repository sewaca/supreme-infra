import { TOKEN_KEY } from '@supreme-int/lib/src/constants/auth.model';
import { cookies } from 'next/headers';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface QoSOptions {
  /** Request timeout in ms. Default: 2500 */
  timeout?: number;
  /** Retry config for safe methods (GET, HEAD, OPTIONS) on network errors and 5xx */
  retry?: {
    /** Max number of retry attempts (not counting the first request). Default: 1 */
    attempts?: number;
    /** Base delay between retries in ms (exponential backoff). Default: 200 */
    delay?: number;
  };
}

/**
 * Creates a fetch function for server-side (SSR/RSC/Server Actions) use that:
 * - Automatically injects Authorization: Bearer <token> from the auth_token cookie
 *   (only if Authorization header is not already set by the caller)
 * - Logs every request with console.time/console.timeEnd
 * - Applies timeout via AbortSignal.timeout()
 * - Retries safe methods (GET, HEAD, OPTIONS) on network errors and 5xx responses
 *
 * Usage: pass the result to hey-api client.setConfig({ fetch: createServerFetch() })
 * or to BaseApi constructor.
 */
export function createServerFetch(qos?: QoSOptions): typeof fetch {
  const timeout = qos?.timeout ?? 2500;
  const maxAttempts = qos?.retry?.attempts ?? 1;
  const retryDelay = qos?.retry?.delay ?? 200;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (
      (init?.method ?? (input instanceof Request ? input.method : undefined) ?? 'GET') as string
    ).toUpperCase();
    const traceId = Math.random().toString(36).slice(2, 10);
    const label = `[${traceId}] ${method} ${url}`;
    const isSafe = SAFE_METHODS.has(method);

    const doFetch = async (): Promise<Response> => {
      const cookieStore = await cookies();
      const token = cookieStore.get(TOKEN_KEY)?.value;

      const existingHeaders = input instanceof Request ? input.headers : init?.headers;
      const headers = new Headers(existingHeaders);
      if (token && !headers.has('authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return globalThis.fetch(input, {
        ...init,
        headers,
        signal: AbortSignal.timeout(timeout),
      });
    };

    console.time(label);
    try {
      for (let attempt = 0; attempt <= (isSafe ? maxAttempts : 0); attempt++) {
        if (attempt > 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, retryDelay * 2 ** (attempt - 1)));
        }
        try {
          const response = await doFetch();
          if (response.status >= 500 && isSafe && attempt < maxAttempts) {
            response.body?.cancel().catch(() => {});
            continue;
          }
          console.timeEnd(label);
          return response;
        } catch (error) {
          if (attempt >= maxAttempts || !isSafe) {
            throw error;
          }
        }
      }
    } catch (error) {
      console.timeEnd(label);
      throw error;
    }

    // unreachable, but satisfies TypeScript
    throw new Error('Unexpected end of fetch loop');
  };
}
