import { jsonBodySerializer } from '@supreme-int/api-client/src/generated/core-auth/client';
import { client as coreAuthClient } from '@supreme-int/api-client/src/generated/core-auth/client.gen';
import { client as coreNewsClient } from '@supreme-int/api-client/src/generated/core-news/client.gen';
import { createBackendFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/backend-qos';
import { getCoreAuthUrl, getCoreNewsUrl } from '../lib/environment';

coreAuthClient.setConfig({
  baseUrl: getCoreAuthUrl(),
  fetch: createBackendFetch('core-auth'),
  ...jsonBodySerializer,
});

coreNewsClient.setConfig({
  baseUrl: getCoreNewsUrl(),
  fetch: createBackendFetch('core-news'),
});

export { coreAuthClient, coreNewsClient };
