import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';

// FIXME: use packages/api-client – delete this when it will not be used
export const loggingFetch = createServerFetch();
