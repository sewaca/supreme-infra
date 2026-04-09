import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { client as coreNewsClient } from '@supreme-int/api-client/src/generated/core-news/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/createServerFetch';
import { environment } from '../lib/environment';

coreNewsClient.setConfig({
  baseUrl: environment.coreNewsUrl,
  fetch: createServerFetch(),
});

coreApplicationsClient.setConfig({
  baseUrl: environment.coreApplicationsUrl,
  fetch: createServerFetch(),
});

coreClientInfoClient.setConfig({
  baseUrl: environment.coreClientInfoUrl,
  fetch: createServerFetch(),
});

coreMessagesClient.setConfig({
  baseUrl: environment.coreMessagesUrl,
  fetch: createServerFetch(),
});

export { coreApplicationsClient, coreClientInfoClient, coreMessagesClient, coreNewsClient };
