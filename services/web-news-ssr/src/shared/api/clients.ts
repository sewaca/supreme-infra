import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { client as coreNewsClient } from '@supreme-int/api-client/src/generated/core-news/client.gen';
import { createBackendFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/backend-qos';
import { environment } from '../lib/environment';

coreNewsClient.setConfig({
  baseUrl: environment.coreNewsUrl,
  fetch: createBackendFetch('core-news'),
});

coreApplicationsClient.setConfig({
  baseUrl: environment.coreApplicationsUrl,
  fetch: createBackendFetch('core-applications'),
});

coreClientInfoClient.setConfig({
  baseUrl: environment.coreClientInfoUrl,
  fetch: createBackendFetch('core-client-info'),
});

coreMessagesClient.setConfig({
  baseUrl: environment.coreMessagesUrl,
  fetch: createBackendFetch('core-messages'),
});

export { coreApplicationsClient, coreClientInfoClient, coreMessagesClient, coreNewsClient };
