export interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  thumbnail_url: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_last_name: string;
  sender_avatar: string | null;
  content: string;
  content_type: string;
  attachments: Attachment[];
  created_at: string;
  is_own: boolean;
}

export interface MessageSearchResult {
  message: Message;
  conversation_id: string;
  conversation_title: string | null;
  conversation_type: string;
  highlight: string;
}
