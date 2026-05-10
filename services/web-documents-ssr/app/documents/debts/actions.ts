'use server';

import { requestRetakeDebtsDebtIdRequestRetakePatch } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import {
  createOrGetDirectConversationConversationsDirectPost,
  sendMessageConversationsConversationIdMessagesPost,
} from '@supreme-int/api-client/src/generated/core-messages';
import { client as coreMessagesClient } from '@supreme-int/api-client/src/generated/core-messages/client.gen';
import { revalidatePath } from 'next/cache';

export async function requestRetake(
  debtId: string,
  teacherId: string,
  content: string,
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  const convRes = await createOrGetDirectConversationConversationsDirectPost({
    client: coreMessagesClient,
    body: { recipient_id: teacherId },
  });

  if (!convRes.data) {
    return { success: false, error: 'Не удалось создать чат с преподавателем' };
  }

  const conversationId = convRes.data.id;

  const msgRes = await sendMessageConversationsConversationIdMessagesPost({
    client: coreMessagesClient,
    path: { conversation_id: conversationId },
    body: { content, content_type: 'text' },
  });

  if (!msgRes.data) {
    return { success: false, error: 'Не удалось отправить сообщение' };
  }

  await requestRetakeDebtsDebtIdRequestRetakePatch({
    client: coreClientInfoClient,
    path: { debt_id: debtId },
    body: { conversation_id: conversationId },
  });

  revalidatePath('/documents/debts');
  return { success: true, conversationId };
}
