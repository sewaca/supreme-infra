import { jsonBodySerializer } from '@supreme-int/api-client/src/generated/core-auth/client';
import { client as coreAuthClient } from '@supreme-int/api-client/src/generated/core-auth/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';
import { getCoreAuthUrl } from '../lib/environment';

coreAuthClient.setConfig({
  baseUrl: getCoreAuthUrl(),
  fetch: createServerFetch(),
  ...jsonBodySerializer,
});

export { coreAuthClient };
