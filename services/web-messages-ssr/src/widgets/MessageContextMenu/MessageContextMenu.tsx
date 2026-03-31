'use client';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';

export type MessageAction = 'reply' | 'reply-dm' | 'copy' | 'edit' | 'delete';

interface Props {
  anchorPosition: { top: number; left: number } | null;
  isOwn: boolean;
  canReplyInDm: boolean;
  onAction: (action: MessageAction) => void;
  onClose: () => void;
}

export function MessageContextMenu({ anchorPosition, isOwn, canReplyInDm, onAction, onClose }: Props) {
  const handle = (action: MessageAction) => () => {
    onAction(action);
    onClose();
  };

  return (
    <Menu
      open={!!anchorPosition}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      slotProps={{ paper: { sx: { minWidth: 180 } } }}
    >
      <MenuItem onClick={handle('reply')} dense>
        <ListItemIcon>
          <ReplyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Ответить</ListItemText>
      </MenuItem>

      {canReplyInDm && (
        <MenuItem onClick={handle('reply-dm')} dense>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ответить в ЛС</ListItemText>
        </MenuItem>
      )}

      <MenuItem onClick={handle('copy')} dense>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Скопировать</ListItemText>
      </MenuItem>

      {isOwn && <Divider />}

      {isOwn && (
        <MenuItem onClick={handle('edit')} dense>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редактировать</ListItemText>
        </MenuItem>
      )}

      {isOwn && (
        <MenuItem onClick={handle('delete')} dense sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Удалить</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
