import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

type Props = { onClose: () => void };

export const CloseButton = ({ onClose }: Props) => {
  return (
    <IconButton onClick={onClose} size="small" sx={{ color: 'text.primary' }}>
      <CloseIcon fontSize="medium" />
    </IconButton>
  );
};
