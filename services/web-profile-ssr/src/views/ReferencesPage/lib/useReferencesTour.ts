'use client';

import { useProductTour } from '@supreme-int/nextjs-shared/src/shared/hooks/useProductTour';
import { useEffect } from 'react';
import { getReferencesTourSteps } from './tour-config';

const TOUR_COMPLETED_KEY = 'references-tour-completed';

export const useReferencesTour = () => {
  const { startTour } = useProductTour({
    steps: getReferencesTourSteps(),
    onComplete: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
    onSkip: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'),
    showProgress: true,
    allowClose: true,
  });

  useEffect(() => {
    if (localStorage.getItem(TOUR_COMPLETED_KEY) === 'true') return;
    const timer = setTimeout(() => startTour(), 500);
    return () => clearTimeout(timer);
  }, [startTour]);

  return { startTour };
};
