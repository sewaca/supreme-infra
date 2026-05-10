import { getAttestationsAttestationsGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
import { unauthorized } from 'next/navigation';
import { AttestationPage } from 'services/web-documents-ssr/src/views/AttestationPage/AttestationPage';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { userId } = await getAuthInfo();

  if (!userId) {
    unauthorized();
  }

  const res = await getAttestationsAttestationsGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  if (res.error) {
    console.error('[attestation] API error:', res.error);
  }

  return <AttestationPage attestations={res.data ?? []} />;
}
