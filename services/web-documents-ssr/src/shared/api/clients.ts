import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/createServerFetch';
import { environment } from '../lib/environment';

coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl, fetch: createServerFetch() });

export { coreClientInfoClient };
