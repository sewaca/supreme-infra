import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';
import { environment } from '../lib/environment';

coreMessagesClient.setConfig({
  baseUrl: environment.coreMessagesUrl,
  fetch: createServerFetch(),
});

coreClientInfoClient.setConfig({
  baseUrl: environment.coreClientInfoUrl,
  fetch: createServerFetch(),
});

export { coreClientInfoClient, coreMessagesClient };
