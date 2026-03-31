import { listConversationsConversationsGet } from '@supreme-int/api-client/src/generated/core-messages';
import { coreMessagesClient } from '../../src/shared/api/clients';
import { getAuthInfo } from '../../src/shared/api/getUserId';
import { MessagesLayout } from '../../src/views/MessagesLayout/MessagesLayout';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthInfo();

  let conversations: any[] = [];
  if (auth.userId) {
    const res = await listConversationsConversationsGet({
      client: coreMessagesClient,
      query: { limit: 30 },
    });
    conversations = res.data?.items ?? [];
  }

  return (
    <MessagesLayout
      initialConversations={conversations as any}
      userRole={auth.role}
      userId={auth.userId}
      token={auth.token}
    >
      {children}
    </MessagesLayout>
  );
}
