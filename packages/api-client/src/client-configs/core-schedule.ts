import { createBackendFetch } from '../fetch/backend-qos';
import { jsonBodySerializer } from '../generated/core-schedule/client';
import type { CreateClientConfig } from '../generated/core-schedule/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.CORE_SCHEDULE_URL || 'http://core-schedule.default.svc.cluster.local/core-schedule',
  fetch: createBackendFetch('core-schedule'),
  ...jsonBodySerializer,
});
