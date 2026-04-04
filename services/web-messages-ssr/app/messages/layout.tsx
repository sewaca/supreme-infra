import { listConversationsConversationsGet } from '@supreme-int/api-client/src/generated/core-messages';
import type { Conversation } from '../../src/entities/Conversation/types';
import { coreMessagesClient } from '../../src/shared/api/clients';
import { getAuthInfo } from '../../src/shared/api/getUserId';
import { mapConversationResponseToConversation } from '../../src/shared/api/mapCoreMessagesApi';
import { MessagesLayout } from '../../src/views/MessagesLayout/MessagesLayout';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthInfo();

  let conversations: Conversation[] = [];
  if (auth.userId) {
    const res = await listConversationsConversationsGet({
      client: coreMessagesClient,
      query: { limit: 30 },
    });
    conversations = (res.data?.items ?? []).map(mapConversationResponseToConversation);
  }

  return (
    <MessagesLayout initialConversations={conversations} userRole={auth.role} userId={auth.userId} token={auth.token}>
      {children}
    </MessagesLayout>
  );
}
