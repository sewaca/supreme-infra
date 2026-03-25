import { client as coreClientInfoClient } from '@supreme-int/api-client/src/core-client-info/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';
import { environment } from '../lib/environment';

coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl, fetch: createServerFetch() });

export { coreClientInfoClient };
