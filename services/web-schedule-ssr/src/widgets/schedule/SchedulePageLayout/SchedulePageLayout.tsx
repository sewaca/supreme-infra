'use client';

import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import styles from './SchedulePageLayout.module.css';

export function SchedulePageContent({ children }: { children: ReactNode }) {
  return <Box className={styles.content}>{children}</Box>;
}

export function SchedulePageToolbar({ children }: { children: ReactNode }) {
  return <Box className={styles.topSection}>{children}</Box>;
}
