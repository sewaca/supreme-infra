'use client';

import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Box, IconButton, Typography } from '@mui/material';
import type { Attachment } from '../../entities/Message/types';

interface Props {
  attachment: Attachment;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function FileAttachment({ attachment }: Props) {
  const isImage = attachment.mime_type.startsWith('image/');

  if (isImage) {
    return (
      <Box
        component="a"
        href={attachment.file_url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'block', borderRadius: 1, overflow: 'hidden', maxWidth: 300 }}
      >
        <img
          src={attachment.thumbnail_url || attachment.file_url}
          alt={attachment.file_name}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 1,
        bgcolor: 'action.hover',
      }}
    >
      <InsertDriveFileIcon color="action" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {attachment.file_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatFileSize(attachment.file_size)}
        </Typography>
      </Box>
      <IconButton component="a" href={attachment.file_url} download size="small">
        <DownloadIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
