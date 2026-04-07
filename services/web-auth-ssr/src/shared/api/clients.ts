import { jsonBodySerializer } from '@supreme-int/api-client/src/generated/core-auth/client';
import { client as coreAuthClient } from '@supreme-int/api-client/src/generated/core-auth/client.gen';
import { client as coreNewsClient } from '@supreme-int/api-client/src/generated/core-news/client.gen';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/createServerFetch';
import { getCoreAuthUrl, getCoreNewsUrl } from '../lib/environment';

coreAuthClient.setConfig({
  baseUrl: getCoreAuthUrl(),
  fetch: createServerFetch(),
  ...jsonBodySerializer,
});

coreNewsClient.setConfig({
  baseUrl: getCoreNewsUrl(),
  fetch: createServerFetch(),
});

export { coreAuthClient, coreNewsClient };
