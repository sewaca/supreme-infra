'use client';

import { Badge, Box, LinearProgress, Paper, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getAchievementProgress } from '../../entities/Rating/achievementsConfig';
import { Achievement } from '../../entities/Rating/RatingData';
import styles from './AchievementBadge.module.css';

type Props = {
  achievement: Achievement;
};

export const AchievementBadge = ({ achievement }: Props) => {
  const progress = getAchievementProgress(achievement);
  const isLocked = !achievement.unlocked;
  const showBadge = achievement.unlocked && achievement.timesEarned && achievement.timesEarned > 1;

  return (
    <Tooltip title={achievement.description} arrow placement="top" enterTouchDelay={0} leaveTouchDelay={3000}>
      <Badge
        badgeContent={showBadge ? `×${achievement.timesEarned}` : null}
        color="success"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: '18px', padding: '0 4px', fontWeight: 700 } }}
      >
        <Paper
          className={`${styles.badge} ${isLocked ? styles.locked : ''}`}
          elevation={isLocked ? 0 : 3}
          sx={{
            width: '100%',
            color: isLocked ? 'text.secondary' : 'text.primary',
            background: isLocked
              ? undefined
              : (theme) =>
                  `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.07)} 100%)`,
          }}
        >
          <Box
            className={styles.iconContainer}
            sx={{
              background: isLocked ? 'rgba(128,128,128,0.1)' : (theme) => alpha(theme.palette.primary.main, 0.12),
            }}
          >
            <Typography
              variant="h3"
              className={styles.icon}
              sx={{ filter: isLocked ? 'grayscale(100%)' : 'none', opacity: isLocked ? 0.4 : 1 }}
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
