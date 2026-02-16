'use client';

import { Badge, Box, LinearProgress, Paper, Tooltip, Typography } from '@mui/material';
import { Achievement } from '../../entities/Rating/RatingData';
import { getAchievementProgress } from '../../entities/Rating/achievementsConfig';
import styles from './AchievementBadge.module.css';

type Props = {
  achievement: Achievement;
};

export const AchievementBadge = ({ achievement }: Props) => {
  const progress = getAchievementProgress(achievement);
  const isLocked = !achievement.unlocked;
  const showBadge = achievement.unlocked && achievement.timesEarned && achievement.timesEarned > 1;

  return (
    <Tooltip title={achievement.description} arrow placement="top">
      <Badge
        badgeContent={showBadge ? `×${achievement.timesEarned}` : null}
        color="success"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: '18px', padding: '0 4px', fontWeight: 700 } }}
      >
        <Paper
          className={`${styles.badge} ${isLocked ? styles.locked : ''}`}
          elevation={isLocked ? 1 : 3}
          sx={{ width: '100%', color: 'text.primary' }}
        >
          <Box className={styles.iconContainer}>
            <Typography
              variant="h3"
              className={styles.icon}
              sx={{ filter: isLocked ? 'grayscale(100%)' : 'none', opacity: isLocked ? 0.5 : 1 }}
            >
              {achievement.icon}
            </Typography>
          </Box>
          <Typography variant="caption" className={styles.title} sx={{ fontWeight: isLocked ? 400 : 600 }}>
            {achievement.title}
          </Typography>
          {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress !== undefined && (
            <Box className={styles.progressContainer}>
              <LinearProgress variant="determinate" value={parseFloat(progress)} sx={{ height: 4, borderRadius: 2 }} />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                {progress}
              </Typography>
            </Box>
          )}
          {achievement.unlocked && achievement.unlockedAt && (
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
              ✓ Получено
            </Typography>
          )}
        </Paper>
      </Badge>
    </Tooltip>
  );
};
