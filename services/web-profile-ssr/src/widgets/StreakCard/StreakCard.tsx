'use client';

import { Box, Paper, Typography } from '@mui/material';
import { Streak } from '../../entities/Rating/RatingData';
import styles from './StreakCard.module.css';

type Props = {
  streak: Streak;
};

export const StreakCard = ({ streak }: Props) => {
  return (
    <Paper
      className={styles.card}
      elevation={3}
      sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' }}
    >
      <Box className={styles.content}>
        <Typography variant="h3" className={styles.icon}>
          🔥
        </Typography>
        <Box className={styles.info}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
            {streak.current} дней
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {streak.description}
          </Typography>
        </Box>
      </Box>
      <Box className={styles.best}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Лучшая серия: {streak.best} дней
        </Typography>
      </Box>
    </Paper>
  );
};
