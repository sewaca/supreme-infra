import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import { client as coreAuthClient } from '@supreme-int/api-client/src/generated/core-auth/client.gen';
import { jsonBodySerializer } from '@supreme-int/api-client/src/generated/core-client-info/client';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { createBackendFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/backend-qos';
import { environment } from '../lib/environment';

coreApplicationsClient.setConfig({
  baseUrl: environment.coreApplicationsUrl,
  fetch: createBackendFetch('core-applications'),
  ...jsonBodySerializer,
});
coreAuthClient.setConfig({
  baseUrl: environment.coreAuthUrl,
  fetch: createBackendFetch('core-auth'),
  ...jsonBodySerializer,
});
coreClientInfoClient.setConfig({
  baseUrl: environment.coreClientInfoUrl,
  fetch: createBackendFetch('core-client-info'),
  ...jsonBodySerializer,
});

export { coreApplicationsClient, coreAuthClient, coreClientInfoClient };
