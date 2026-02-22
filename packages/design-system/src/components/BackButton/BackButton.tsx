import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import IconButton from '@mui/material/IconButton';

type Props = { onBack: () => void };

export const BackButton = ({ onBack }: Props) => {
  return (
    <IconButton onClick={onBack} size="small" sx={{ color: 'text.primary' }}>
      <ArrowBackIosNewRoundedIcon fontSize="small" />
    </IconButton>
  );
};
