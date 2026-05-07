import { TOKEN_KEY } from '../constants/auth.model';

export interface ClientQoSOptions {
  /** Request timeout in ms. Default: 2500 */
  timeout?: number;
}

/**
 * Creates a fetch function for client-side (browser / 'use client') use that:
 * - Reads the auth token from document.cookie
 * - Injects Authorization: Bearer <token> header (unless already set)
 * - Applies timeout via AbortSignal.timeout()
 */
export function createClientFetch(qos?: ClientQoSOptions): typeof fetch {
  const timeout = qos?.timeout ?? 2500;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
    const token = match ? decodeURIComponent(match[1]) : undefined;

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
}
