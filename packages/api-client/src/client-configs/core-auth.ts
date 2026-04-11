import { createBackendFetch } from '../fetch/backend-qos';
import { jsonBodySerializer } from '../generated/core-auth/client';
import type { CreateClientConfig } from '../generated/core-auth/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.CORE_AUTH_URL || 'http://core-auth.default.svc.cluster.local/core-auth',
  fetch: createBackendFetch('core-auth'),
  ...jsonBodySerializer,
});
