import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import { client as coreAuthClient } from '@supreme-int/api-client/src/generated/core-auth/client.gen';
import { jsonBodySerializer } from '@supreme-int/api-client/src/generated/core-client-info/client';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';
import { environment } from '../lib/environment';

const sharedConfig = { fetch: createServerFetch(), ...jsonBodySerializer };

coreApplicationsClient.setConfig({ baseUrl: environment.coreApplicationsUrl, ...sharedConfig });
coreAuthClient.setConfig({ baseUrl: environment.coreAuthUrl, ...sharedConfig });
coreClientInfoClient.setConfig({ baseUrl: environment.coreClientInfoUrl, ...sharedConfig });

export { coreApplicationsClient, coreAuthClient, coreClientInfoClient };
