import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { client as coreScheduleClient } from '@supreme-int/api-client/src/generated/core-schedule/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';
import { environment } from '../lib/environment';

coreScheduleClient.setConfig({ baseUrl: environment.coreScheduleUrl, fetch: createServerFetch() });
coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl, fetch: createServerFetch() });

export { coreScheduleClient, coreClientInfoClient };
