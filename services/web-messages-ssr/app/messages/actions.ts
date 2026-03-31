'use server';

import {
  createBroadcastBroadcastsPost,
  createOrGetDirectConversationConversationsDirectPost,
  deleteConversationConversationsConversationIdDelete,
  getGroupsBroadcastsGroupsGet,
  markReadConversationsConversationIdMessagesReadPost,
  searchMessagesMessagesSearchGet,
  searchUsersUsersSearchGet,
  sendMessageConversationsConversationIdMessagesPost,
} from '@supreme-int/api-client/src/generated/core-messages';
import { createServerFetch } from '@supreme-int/nextjs-shared/src/shared/fetch/create-server-fetch';
import type { Message } from '../../src/entities/Message/types';
import { coreMessagesClient } from '../../src/shared/api/clients';
import { environment } from '../../src/shared/lib/environment';

export async function sendMessage(
  conversationId: string,
  content: string,
  replyToId?: string | null,
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const res = await sendMessageConversationsConversationIdMessagesPost({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
      body: { content, content_type: 'text', ...(replyToId ? { reply_to_id: replyToId } : {}) } as any,
    });

    if (res.data) {
      return { success: true, message: res.data as Message };
    }
    return { success: false, error: 'Не удалось отправить сообщение' };
  } catch {
    return { success: false, error: 'Ошибка отправки сообщения' };
  }
}

export async function createDirectConversation(
  recipientId: string,
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const res = await createOrGetDirectConversationConversationsDirectPost({
      client: coreMessagesClient,
      body: { recipient_id: recipientId },
    });

    if (res.data) {
      return { success: true, conversationId: res.data.id };
    }
    return { success: false, error: 'Не удалось создать чат' };
  } catch {
    return { success: false, error: 'Ошибка создания чата' };
  }
}

export async function createBroadcast(
  title: string,
  groupNames: string[],
  initialMessage?: string,
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const res = await createBroadcastBroadcastsPost({
      client: coreMessagesClient,
      body: { title, group_names: groupNames, initial_message: initialMessage || undefined },
    });

    if (res.data) {
      return { success: true, conversationId: res.data.id };
    }
    return { success: false, error: 'Не удалось создать рассылку' };
  } catch {
    return { success: false, error: 'Ошибка создания рассылки' };
  }
}

export async function markAsRead(conversationId: string, lastReadMessageId: string): Promise<void> {
  try {
    await markReadConversationsConversationIdMessagesReadPost({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
      body: { last_read_message_id: lastReadMessageId },
    });
  } catch {
    console.error('[markAsRead] failed for conversation:', conversationId);
  }
}

export async function deleteConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteConversationConversationsConversationIdDelete({
      client: coreMessagesClient,
      path: { conversation_id: conversationId },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Не удалось удалить чат' };
  }
}

export async function searchUsers(
  query: string,
): Promise<{ user_id: string; name: string; last_name: string; avatar: string | null }[]> {
  try {
    const res = await searchUsersUsersSearchGet({
      client: coreMessagesClient,
      query: { q: query, limit: 10 },
    });
    return (res.data?.items ?? []) as { user_id: string; name: string; last_name: string; avatar: string | null }[];
  } catch {
    return [];
  }
}

export async function searchMessages(query: string, cursor?: string) {
  try {
    const res = await searchMessagesMessagesSearchGet({
      client: coreMessagesClient,
      query: { q: query, cursor, limit: 20 },
    });
    return res.data ?? { items: [], next_cursor: null };
  } catch {
    return { items: [], next_cursor: null };
  }
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  content: string,
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const fetchWithAuth = createServerFetch();
    const res = await fetchWithAuth(
      `${environment.coreMessagesUrl}/conversations/${conversationId}/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      },
    );
    if (!res.ok) return { success: false, error: 'Не удалось редактировать сообщение' };
    const data = await res.json();
    return { success: true, message: data as Message };
  } catch {
    return { success: false, error: 'Ошибка редактирования сообщения' };
  }
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fetchWithAuth = createServerFetch();
    const res = await fetchWithAuth(
      `${environment.coreMessagesUrl}/conversations/${conversationId}/messages/${messageId}`,
      { method: 'DELETE' },
    );
    return { success: res.ok };
  } catch {
    return { success: false, error: 'Ошибка удаления сообщения' };
  }
}

export async function getAvailableGroups(): Promise<string[]> {
  try {
    const res = await getGroupsBroadcastsGroupsGet({
      client: coreMessagesClient,
    });
    return (res.data as string[]) ?? [];
  } catch {
    return [];
  }
}
