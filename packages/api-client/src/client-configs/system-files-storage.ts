import { createBackendFetch } from '../fetch/backend-qos';
import { jsonBodySerializer } from '../generated/system-files-storage/client';
import type { CreateClientConfig } from '../generated/system-files-storage/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl:
    process.env.FILES_STORAGE_URL || 'http://system-files-storage.default.svc.cluster.local/system-files-storage',
  fetch: createBackendFetch('system-files-storage'),
  ...jsonBodySerializer,
});
