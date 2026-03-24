import { client as coreClientInfoClient } from '@supreme-int/api-client/src/core-client-info/client.gen';
import { environment } from '../lib/environment';

coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl });

export { coreClientInfoClient };
