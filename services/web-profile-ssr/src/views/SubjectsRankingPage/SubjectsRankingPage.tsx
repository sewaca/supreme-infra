'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { Spacer } from '@supreme-int/design-system/src/components/Spacer/Spacer';
import { i18n } from '@supreme-int/i18n';
import { useEffect } from 'react';
import { useProductTour } from '../../shared/hooks/useProductTour';
import { DefaultNavbar } from '../../widgets/DefaultNavbar/DefaultNavbar';
import type { SortableItem } from '../../widgets/SortedList/types';
import { getSubjectsRankingTourSteps } from './tour-config';
import { SubjectsRankingPageView } from './SubjectsRankingPageView';

export type Subject = SortableItem & { name: string; teacher: string };

const TOUR_COMPLETED_KEY = 'subjects-ranking-tour-completed';

type Props = {
  subjects: Subject[][];
  deadlineDate: string;
};

export const SubjectsRankingPage = ({ subjects, deadlineDate }: Props) => {
  const { startTour } = useProductTour({
    steps: getSubjectsRankingTourSteps(deadlineDate),
    onComplete: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
    onSkip: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
    showProgress: true,
    allowClose: true,
  });

  useEffect(() => {
    if (localStorage.getItem(TOUR_COMPLETED_KEY) === 'true') return;

    const timer = setTimeout(() => startTour, 500);
    return () => clearTimeout(timer);
  }, [startTour]);

  return (
    <>
      <DefaultNavbar />
      <Container>
        <Spacer size={8} />
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5">{i18n('Дисциплины по выбору')}</Typography>
          <IconButton
            size="small"
            onClick={startTour}
            aria-label={i18n('Показать обучение')}
            sx={{ color: 'text.secondary' }}
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
        <Spacer size={6} />
        <Typography variant="body2">
          {i18n('Отсортируйте дисциплины в порядке убывания приоритета, а затем нажмите сохранить.')}
        </Typography>

        <Spacer size={8} />
        <Divider />
        <Spacer size={8} />

        {subjects.length > 0 ? (
          <SubjectsRankingPageView subjects={subjects} deadlineDate={deadlineDate} />
        ) : (
          <Typography variant="h6" textAlign="center">
            {i18n('Пока что дисциплин для выбора нет')}
          </Typography>
        )}
      </Container>
    </>
  );
};
