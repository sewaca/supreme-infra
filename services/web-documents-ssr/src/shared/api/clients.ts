import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { createBackendFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/backend-qos';
import { environment } from '../lib/environment';

coreClientInfoClient.setConfig({
  baseUrl: environment.coreClientInfoUrl,
  fetch: createBackendFetch('core-client-info'),
});

export { coreClientInfoClient };
