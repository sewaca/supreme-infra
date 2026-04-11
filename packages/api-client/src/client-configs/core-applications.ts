import { createBackendFetch } from '../fetch/backend-qos';
import { jsonBodySerializer } from '../generated/core-applications/client';
import type { CreateClientConfig } from '../generated/core-applications/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.CORE_APPLICATIONS_URL || 'http://core-applications.default.svc.cluster.local/core-applications',
  fetch: createBackendFetch('core-applications'),
  ...jsonBodySerializer,
});
