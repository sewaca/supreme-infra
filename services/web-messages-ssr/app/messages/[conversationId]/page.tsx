import {
  getConversationConversationsConversationIdGet,
  listMessagesConversationsConversationIdMessagesGet,
} from '@supreme-int/api-client/src/generated/core-messages';
import { redirect } from 'next/navigation';
import { coreMessagesClient } from '../../../src/shared/api/clients';
import { getAuthInfo } from '../../../src/shared/api/getUserId';
import {
  mapConversationResponseToConversation,
  mapMessageResponseToMessage,
} from '../../../src/shared/api/mapCoreMessagesApi';
import { ChatView } from '../../../src/views/ChatView/ChatView';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default async function Page({ params }: Props) {
  const { conversationId } = await params;
  const auth = await getAuthInfo();

  if (!auth.userId) redirect('/login');

  const [convRes, messagesRes] = await Promise.allSettled([
    getConversationConversationsConversationIdGet({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
    }),
    listMessagesConversationsConversationIdMessagesGet({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
      query: { limit: 30 },
    }),
  ]);

  const conversation = convRes.status === 'fulfilled' ? convRes.value.data : null;
  const messagesData = messagesRes.status === 'fulfilled' ? messagesRes.value.data : null;

  if (!conversation) redirect('/messages');

  return (
    <ChatView
      conversation={mapConversationResponseToConversation(conversation)}
      initialMessages={(messagesData?.items ?? []).map(mapMessageResponseToMessage)}
      initialCursor={messagesData?.next_cursor ?? null}
      initialHasMore={messagesData?.has_more ?? false}
      userId={auth.userId}
      userRole={auth.role}
    />
  );
}
