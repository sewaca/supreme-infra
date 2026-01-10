import BackShortArrow from '../../icons/BackShortArrow.inline.svg';
import styles from './BackButton.module.css';

type Props = {
  onBack: () => void;
};

export const BackButton = ({ onBack }: Props) => {
  return (
    <div className={styles.block} onClick={onBack}>
      <BackShortArrow />
    </div>
  );
};
