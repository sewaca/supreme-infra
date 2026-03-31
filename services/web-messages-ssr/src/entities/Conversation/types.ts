export interface ParticipantBrief {
  user_id: string;
  name: string;
  last_name: string;
  avatar: string | null;
  role: string | null;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'broadcast';
  title: string | null;
  owner_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  participants: ParticipantBrief[];
  participant_count: number;
}

export interface ConversationUpdateItem {
  conversation_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  last_sender_name: string | null;
}
