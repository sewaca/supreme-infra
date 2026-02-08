'use client';

import { useProductTour } from '@supreme-int/nextjs-shared/src/shared/hooks/useProductTour';
import { useEffect } from 'react';
import { getSubjectsRankingTourSteps } from './tour-config';

const TOUR_COMPLETED_KEY = 'subjects-ranking-tour-completed';

type Props = { deadlineDate: string; subjectsLength?: number };

export const useSubjectsRankingTour = ({ deadlineDate, subjectsLength }: Props) => {
  const { startTour } = useProductTour({
    steps: getSubjectsRankingTourSteps(deadlineDate),
    onComplete: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
    onSkip: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),

    showProgress: true,
    allowClose: true,
  });

  useEffect(() => {
    if (localStorage.getItem(TOUR_COMPLETED_KEY) === 'true') return;
    if (subjectsLength === 0) return;

    const timer = setTimeout(() => startTour, 500);
    return () => clearTimeout(timer);
  }, [startTour, subjectsLength]);

  return { startTour };
};
