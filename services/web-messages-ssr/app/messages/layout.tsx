import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { listConversationsConversationsGet } from '@supreme-int/api-client/src/generated/core-messages';
import type { Conversation } from '../../src/entities/Conversation/types';
import { coreClientInfoClient, coreMessagesClient } from '../../src/shared/api/clients';
import { getAuthInfo } from '../../src/shared/api/getUserId';
import { mapConversationResponseToConversation } from '../../src/shared/api/mapCoreMessagesApi';
import { MessagesLayout } from '../../src/views/MessagesLayout/MessagesLayout';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthInfo();

  let conversations: Conversation[] = [];
  let avatar: string | null = null;
  let userName = auth.name ?? '';

  if (auth.userId) {
    const [conversationsRes, profileRes] = await Promise.all([
      listConversationsConversationsGet({ client: coreMessagesClient, query: { limit: 30 } }),
      getUserProfileUserGet({ client: coreClientInfoClient, query: { user_id: auth.userId } }),
    ]);
    conversations = (conversationsRes.data?.items ?? []).map(mapConversationResponseToConversation);
    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name ?? userName;
    }
  }

  return (
    <MessagesLayout
      initialConversations={conversations}
      userRole={auth.role}
      userId={auth.userId}
      token={auth.token}
      avatar={avatar}
      userName={userName}
    >
      {children}
    </MessagesLayout>
  );
}
