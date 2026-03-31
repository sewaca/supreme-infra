import { listBroadcastsBroadcastsGet } from '@supreme-int/api-client/src/generated/core-messages';
import { redirect } from 'next/navigation';
import { coreMessagesClient } from '../../../src/shared/api/clients';
import { getAuthInfo } from '../../../src/shared/api/getUserId';
import { BroadcastListView } from '../../../src/views/BroadcastListView/BroadcastListView';

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const auth = await getAuthInfo();
  if (auth.role !== 'teacher') redirect('/messages');

  const res = await listBroadcastsBroadcastsGet({
    client: coreMessagesClient,
  });

  return <BroadcastListView broadcasts={(res.data ?? []) as any} />;
}
