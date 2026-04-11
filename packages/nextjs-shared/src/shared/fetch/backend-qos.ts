import { createServerFetch, type QoSOptions } from './createServerFetch';

export type BackendName =
  | 'core-auth'
  | 'core-applications'
  | 'core-client-info'
  | 'core-messages'
  | 'core-news'
  | 'core-schedule'
  | 'system-files-storage';

/**
 * Per-backend QoS defaults.
 *
 * Rationale:
 * - core-auth: no retry — auth failures should surface immediately, not be masked by retries
 * - core-*: 1 retry — tolerate transient backend hiccups in read-heavy services
 * - system-files-storage: longer timeout for file I/O, no retry — files can be large
 */
export const BACKEND_QOS: Record<BackendName, QoSOptions> = {
  'core-auth': {
    timeout: 1500,
    retry: { attempts: 0 },
  },
  'core-applications': {
    timeout: 2500,
    retry: { attempts: 1, delay: 200 },
  },
  'core-client-info': {
    timeout: 2500,
    retry: { attempts: 1, delay: 200 },
  },
  'core-messages': {
    timeout: 2500,
    retry: { attempts: 1, delay: 200 },
  },
  'core-news': {
    timeout: 2500,
    retry: { attempts: 1, delay: 200 },
  },
  'core-schedule': {
    timeout: 2500,
    retry: { attempts: 1, delay: 200 },
  },
  'system-files-storage': {
    timeout: 10_000,
    retry: { attempts: 0 },
  },
};

export function createBackendFetch(backend: BackendName): typeof fetch {
  return createServerFetch(BACKEND_QOS[backend]);
}
