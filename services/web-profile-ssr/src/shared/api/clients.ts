import { client as coreApplicationsClient } from '@supreme-int/api-client/src/core-applications/client.gen';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/core-client-info/client.gen';
import { environment } from '../lib/environment';

coreApplicationsClient.setConfig({ baseUrl: environment.coreApplicationsUrl });
coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl });

export { coreApplicationsClient, coreClientInfoClient };
