'use client';

import { ReactNode } from 'react';
import styles from './NavBar.module.css';
// import { ReactComponent as BackShortArrow } from '../../icons/BackShortArrow.inline.svg';
import BackShortArrow from '../../icons/BackShortArrow.inline.svg';

type Props = {
  onBack?: () => void;
  leftSlot?: ReactNode;
  center?: ReactNode;
  rightSlot?: ReactNode;
};

console.log('[test] BackShortArrow', BackShortArrow);

export const NavBar = ({ onBack, leftSlot, center, rightSlot }: Props) => {
  return (
    <div className={styles.blocks}>
      <div className={styles.leftSlot}>
        {leftSlot ? (
          leftSlot
        ) : (
          <div className={styles.backButton} onClick={onBack}>
            <BackShortArrow />
          </div>
        )}
      </div>

      <div className={styles.center}>{center}</div>

      <div className={styles.rightSlot}>{rightSlot}</div>
    </div>
  );
};
