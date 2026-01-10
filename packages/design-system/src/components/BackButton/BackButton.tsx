import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import styles from './BackButton.module.css';

type Props = { onBack: () => void };

export const BackButton = ({ onBack }: Props) => {
  return (
    <div className={styles.block} onClick={onBack}>
      <ArrowBackIosNewRoundedIcon fontSize="small" />
    </div>
  );
};
