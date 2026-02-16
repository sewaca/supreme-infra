'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Chip, Divider, IconButton, Paper, Typography } from '@mui/material';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { useState } from 'react';
import { RatingData, RatingFilters as RatingFiltersType } from '../../entities/Rating/RatingData';
import { AchievementBadge } from '../../widgets/AchievementBadge/AchievementBadge';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import { LevelProgress } from '../../widgets/LevelProgress/LevelProgress';
import { RankingCard } from '../../widgets/RankingCard/RankingCard';
import { RatingFilters } from '../../widgets/RatingFilters/RatingFilters';
import { StreakCard } from '../../widgets/StreakCard/StreakCard';
import { useRatingTour } from './lib/useRatingTour';
import styles from './RatingPage.module.css';

type Props = {
  data: RatingData;
};

export const RatingPage = ({ data }: Props) => {
  const { startTour } = useRatingTour();
  const [filters, setFilters] = useState<RatingFiltersType>({
    period: 'all_time',
    educationForm: 'all',
    specialty: 'all',
  });
  const unlockedAchievements = data.achievements.filter((a) => a.unlocked);
  const lockedAchievements = data.achievements.filter((a) => !a.unlocked);

  return (
    <Paper sx={{ minHeight: '100dvh', backgroundColor: 'var(--color-background-primary)' }} elevation={0}>
      <DefaultNavbar
        rightSlot={
          <IconButton onClick={startTour} aria-label={i18n('Показать обучение')}>
            <HelpOutlineIcon fontSize="small" color="inherit" />
          </IconButton>
        }
        center={<Typography variant="title1">Мой рейтинг</Typography>}
      />
      <Box className={styles.content}>
        <Box className={styles.statsCard} data-tour="student-stats">
          <Typography variant="h5" sx={{ fontWeight: 700, marginBottom: 2 }}>
            Информация о студенте
          </Typography>
          <Box className={styles.statsGrid}>
            <Box className={styles.statItem}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Курс
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {data.studentStats.course}
              </Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Факультет
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.studentStats.faculty}
              </Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Средний балл
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color:
                    data.studentStats.averageGrade >= 4.5
                      ? 'success.main'
                      : data.studentStats.averageGrade >= 4.0
                        ? 'primary.main'
                        : 'text.primary',
                }}
              >
                {data.studentStats.averageGrade.toFixed(2)}
              </Typography>
            </Box>
            <Box className={styles.statItem}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Форма обучения
              </Typography>
              <Chip
                label={data.studentStats.educationForm === 'budget' ? 'Бюджет' : 'Контракт'}
                size="small"
                color={data.studentStats.educationForm === 'budget' ? 'success' : 'primary'}
              />
            </Box>
          </Box>
        </Box>
        <Box data-tour="level-progress">
          <LevelProgress levelInfo={data.level} />
        </Box>
        <Box data-tour="streak-card">
          <StreakCard streak={data.streak} />
        </Box>
        <Spacer size={4} />
        <Typography variant="h6" sx={{ fontWeight: 700, padding: '0 4px' }}>
          Фильтры рейтинга
        </Typography>
        <Box data-tour="rating-filters">
          <RatingFilters filters={filters} onChange={setFilters} />
        </Box>
        <Spacer size={4} />
        <Typography variant="h6" sx={{ fontWeight: 700, padding: '0 4px' }}>
          Твоя позиция
        </Typography>
        <Spacer size={2} />
        <Box className={styles.rankingsGrid} data-tour="ranking-cards">
          <RankingCard title="По курсу" icon="🎓" ranking={data.rankings.byCourse} />
          <RankingCard title="По факультету" icon="🏛️" ranking={data.rankings.byFaculty} />
          <RankingCard title="По вузу" icon="🏫" ranking={data.rankings.byUniversity} />
          <RankingCard title="По специальности" icon="📚" ranking={data.rankings.bySpecialty} />
          <RankingCard title="По посещаемости" icon="📅" ranking={data.rankings.byAttendance} />
        </Box>
        <Spacer size={6} />
        <Divider />
        <Spacer size={4} />
        <Typography variant="h6" sx={{ fontWeight: 700, padding: '0 4px' }}>
          Достижения ({unlockedAchievements.length}/{data.achievements.length})
        </Typography>
        <Spacer size={2} />
        <Box data-tour="achievements">
          {unlockedAchievements.length > 0 && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', padding: '0 4px', marginBottom: 2 }}>
                Получено
              </Typography>
              <Box className={styles.achievementsGrid}>
                {unlockedAchievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </Box>
            </>
          )}
          {lockedAchievements.length > 0 && (
            <>
              <Spacer size={3} />
              <Typography variant="body2" sx={{ color: 'text.secondary', padding: '0 4px', marginBottom: 2 }}>
                Ещё не получено
              </Typography>
              <Box className={styles.achievementsGrid}>
                {lockedAchievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </Box>
            </>
          )}
        </Box>
        <Spacer size={4} />
      </Box>
    </Paper>
  );
};
