'use client';

import { ReactNode } from 'react';
import { BackButton } from '../BackButton/BackButton';
import styles from './NavBar.module.css';

type Props = {
  onBack?: () => void;
  leftSlot?: ReactNode;
  center?: ReactNode;
  rightSlot?: ReactNode;
};

export const NavBar = ({ onBack, leftSlot, center, rightSlot }: Props) => {
  return (
    <div className={styles.block}>
      <div className={styles.leftSlot}>{leftSlot ? leftSlot : onBack ? <BackButton onBack={onBack} /> : null}</div>

      <div className={styles.center}>{center}</div>

      <div className={styles.rightSlot}>{rightSlot}</div>
    </div>
  );
};
