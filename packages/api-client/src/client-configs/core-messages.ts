import { createBackendFetch } from '../fetch/backend-qos';
import { jsonBodySerializer } from '../generated/core-messages/client';
import type { CreateClientConfig } from '../generated/core-messages/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.CORE_MESSAGES_URL || 'http://core-messages.default.svc.cluster.local/core-messages',
  fetch: createBackendFetch('core-messages'),
  ...jsonBodySerializer,
});
