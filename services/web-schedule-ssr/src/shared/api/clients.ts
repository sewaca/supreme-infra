import { client as coreAuthClient } from '@supreme-int/api-client/src/generated/core-auth/client.gen';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { client as coreScheduleClient } from '@supreme-int/api-client/src/generated/core-schedule/client.gen';
import { createBackendFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/backend-qos';
import { environment } from '../lib/environment';

coreScheduleClient.setConfig({ baseUrl: environment.coreScheduleUrl, fetch: createBackendFetch('core-schedule') });
coreClientInfoClient.setConfig({
  baseUrl: environment.coreClientInfoUrl,
  fetch: createBackendFetch('core-client-info'),
});
coreAuthClient.setConfig({ baseUrl: environment.coreAuthUrl, fetch: createBackendFetch('core-auth') });
coreMessagesClient.setConfig({ baseUrl: environment.coreMessagesUrl, fetch: createBackendFetch('core-messages') });

export { coreAuthClient, coreClientInfoClient, coreMessagesClient, coreScheduleClient };
