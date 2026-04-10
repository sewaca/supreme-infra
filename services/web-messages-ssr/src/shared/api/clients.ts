import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { createBackendFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/backend-qos';
import { environment } from '../lib/environment';

coreMessagesClient.setConfig({
  baseUrl: environment.coreMessagesUrl,
  fetch: createBackendFetch('core-messages'),
});

coreClientInfoClient.setConfig({
  baseUrl: environment.coreClientInfoUrl,
  fetch: createBackendFetch('core-client-info'),
});

export { coreClientInfoClient, coreMessagesClient };
