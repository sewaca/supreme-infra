import { listBroadcastsBroadcastsGet } from '@supreme-int/api-client/src/generated/core-messages';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
import { redirect } from 'next/navigation';
import { mapConversationResponseToConversation } from '../../../src/shared/api/mapCoreMessagesApi';
import { BroadcastListView } from '../../../src/views/BroadcastListView/BroadcastListView';

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const auth = await getAuthInfo();
  if (auth.role !== 'teacher') redirect('/messages');

  const res = await listBroadcastsBroadcastsGet({
    client: coreMessagesClient,
  });

  return <BroadcastListView broadcasts={(res.data ?? []).map(mapConversationResponseToConversation)} />;
}
