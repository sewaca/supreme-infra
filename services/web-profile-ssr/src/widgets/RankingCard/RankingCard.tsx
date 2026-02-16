'use client';

import { Box, Paper, Typography } from '@mui/material';
import { RankingPosition } from '../../entities/Rating/RatingData';
import styles from './RankingCard.module.css';

type Props = {
  title: string;
  icon: string;
  ranking: RankingPosition;
};

export const RankingCard = ({ title, icon, ranking }: Props) => {
  const getPositionColor = (percentile: number): string => {
    if (percentile >= 99) return '#D4AF37';
    if (percentile >= 97) return '#A8A9AD';
    if (percentile >= 90) return '#CD7F32';
    if (percentile >= 75) return '#2196F3';
    if (percentile >= 50) return '#4CAF50';
    return '#9E9E9E';
  };

  const getPositionEmoji = (percentile: number): string => {
    if (percentile >= 99) return '🥇';
    if (percentile >= 97) return '🥈';
    if (percentile >= 90) return '🥉';
    if (percentile >= 75) return '⭐';
    if (percentile >= 50) return '✨';
    return '📊';
  };

  return (
    <Paper
      className={styles.card}
      elevation={2}
      sx={{ borderLeft: `4px solid ${getPositionColor(ranking.percentile)}` }}
    >
      <Box className={styles.header}>
        <Typography variant="h4">{icon}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
      <Box className={styles.content}>
        <Box className={styles.position}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: getPositionColor(ranking.percentile) }}>
            {getPositionEmoji(ranking.percentile)} #{ranking.position}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            из {ranking.total}
          </Typography>
        </Box>
        <Box className={styles.percentile}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Топ {Math.round(100 - ranking.percentile)}%
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
