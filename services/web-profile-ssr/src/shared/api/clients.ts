import { client as coreApplicationsClient } from '@supreme-int/api-client/src/core-applications/client.gen';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/core-client-info/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';
import { environment } from '../lib/environment';

coreApplicationsClient.setConfig({ baseUrl: environment.coreApplicationsUrl, fetch: createServerFetch() });
coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl, fetch: createServerFetch() });

export { coreApplicationsClient, coreClientInfoClient };
