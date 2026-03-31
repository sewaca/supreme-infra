'use client';

import { Avatar, Box, Typography } from '@mui/material';
import type { Message } from '../../entities/Message/types';
import { formatMessageTime } from '../../shared/lib/formatDate';
import { FileAttachment } from '../FileAttachment/FileAttachment';
import styles from './ChatBubble.module.css';

interface Props {
  message: Message;
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: Props) {
  return (
    <Box className={`${styles.wrapper} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (
        <Avatar src={message.sender_avatar ?? undefined} sx={{ width: 32, height: 32, mt: 0.5 }}>
          {message.sender_name[0]}
        </Avatar>
      )}
      <Box className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
        {!isOwn && (
          <Typography variant="caption" fontWeight={600} color="primary.main">
            {message.sender_name} {message.sender_last_name}
          </Typography>
        )}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Typography>
        {message.attachments.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {message.attachments.map((att) => (
              <FileAttachment key={att.id} attachment={att} />
            ))}
          </Box>
        )}
        <Typography
          variant="caption"
          color={isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
          sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
        >
          {formatMessageTime(message.created_at)}
        </Typography>
      </Box>
    </Box>
  );
}
