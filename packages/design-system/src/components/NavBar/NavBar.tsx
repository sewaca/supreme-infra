'use client';

import { AppBar } from '@mui/material';
import { ComponentProps, ReactNode } from 'react';
import { BackButton } from '../BackButton/BackButton';
import styles from './NavBar.module.css';

type Props = {
  onBack?: () => void;
  leftSlot?: ReactNode;
  center?: ReactNode;
  rightSlot?: ReactNode;

  color?: ComponentProps<typeof AppBar>['color'];
  position?: ComponentProps<typeof AppBar>['position'];
};

export const NavBar = ({ onBack, leftSlot, center, rightSlot, color = 'transparent', position = 'static' }: Props) => {
  return (
    <AppBar color={color} position={position} elevation={0}>
      <div className={styles.block}>
        <div className={styles.leftSlot}>{leftSlot ? leftSlot : onBack ? <BackButton onBack={onBack} /> : null}</div>

        <div className={styles.center}>{center}</div>

        <div className={styles.rightSlot}>{rightSlot}</div>
      </div>
    </AppBar>
  );
};
