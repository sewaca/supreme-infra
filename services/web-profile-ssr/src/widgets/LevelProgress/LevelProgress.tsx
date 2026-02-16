'use client';

import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { LevelInfo } from '../../entities/Rating/RatingData';
import styles from './LevelProgress.module.css';

type Props = {
  levelInfo: LevelInfo;
};

export const LevelProgress = ({ levelInfo }: Props) => {
  const progress = levelInfo.nextLevelXP > 0 ? (levelInfo.currentXP / levelInfo.nextLevelXP) * 100 : 100;
  const isMaxLevel = levelInfo.level === 'legend';

  return (
    <Paper
      className={styles.container}
      elevation={3}
      sx={{ background: `linear-gradient(135deg, ${levelInfo.color}22 0%, ${levelInfo.color}44 100%)` }}
    >
      <Box className={styles.header}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: levelInfo.color }}>
          {levelInfo.title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Уровень студента
        </Typography>
      </Box>
      <Box className={styles.progressSection}>
        <Box className={styles.xpInfo}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {levelInfo.currentXP} XP
          </Typography>
          {!isMaxLevel && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              / {levelInfo.nextLevelXP} XP
            </Typography>
          )}
        </Box>
        {!isMaxLevel ? (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: `${levelInfo.color}33`,
              '& .MuiLinearProgress-bar': { backgroundColor: levelInfo.color },
            }}
          />
        ) : (
          <Typography
            variant="caption"
            sx={{ color: levelInfo.color, fontWeight: 600, textAlign: 'center', marginTop: 1 }}
          >
            🏆 Максимальный уровень достигнут!
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
