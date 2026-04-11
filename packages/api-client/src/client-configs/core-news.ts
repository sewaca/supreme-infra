import { createBackendFetch } from '../fetch/backend-qos';
import { jsonBodySerializer } from '../generated/core-news/client';
import type { CreateClientConfig } from '../generated/core-news/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.CORE_NEWS_URL || 'http://core-news.default.svc.cluster.local/core-news',
  fetch: createBackendFetch('core-news'),
  ...jsonBodySerializer,
});
