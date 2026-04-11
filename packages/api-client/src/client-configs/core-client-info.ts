import { createBackendFetch } from '../fetch/backend-qos';
import { jsonBodySerializer } from '../generated/core-client-info/client';
import type { CreateClientConfig } from '../generated/core-client-info/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.CORE_CLIENT_INFO_URL || 'http://core-client-info.default.svc.cluster.local/core-client-info',
  fetch: createBackendFetch('core-client-info'),
  ...jsonBodySerializer,
});
