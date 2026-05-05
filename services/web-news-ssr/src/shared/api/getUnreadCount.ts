import { getTotalUnreadCountConversationsUnreadCountGet } from '@supreme-int/api-client/src/generated/core-messages';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { cache } from 'react';

export const getUnreadCount = cache(async (): Promise<number> => {
  const res = await getTotalUnreadCountConversationsUnreadCountGet({ client: coreMessagesClient });
  return res.data?.total_unread_count ?? 0;
});
