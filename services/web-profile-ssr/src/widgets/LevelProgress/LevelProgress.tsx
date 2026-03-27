'use client';

import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { LevelInfo } from '../../entities/Rating/RatingData';
import styles from './LevelProgress.module.css';

type Props = {
  levelInfo: LevelInfo;
};

export const LevelProgress = ({ levelInfo }: Props) => {
  const isMaxLevel = levelInfo.level === 'legend';
  const range = levelInfo.nextLevelXP - levelInfo.currentLevelMinXP;
  const earned = levelInfo.currentXP - levelInfo.currentLevelMinXP;
  const progress = range > 0 ? Math.min((earned / range) * 100, 100) : 100;

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
        {!isMaxLevel ? (
          <>
            <Box className={styles.xpInfo}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                до уровня «{levelInfo.nextLevelTitle}»
              </Typography>
            </Box>
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
          </>
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
