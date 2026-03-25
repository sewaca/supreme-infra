import { client as coreApplicationsClient } from '@supreme-int/api-client/src/core-applications/client.gen';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/core-client-info/client.gen';
import { environment } from '../lib/environment';
import { loggingFetch } from './fetchWithLog';

coreApplicationsClient.setConfig({ baseUrl: environment.coreApplicationsUrl, fetch: loggingFetch });
coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl, fetch: loggingFetch });

export { coreApplicationsClient, coreClientInfoClient };
