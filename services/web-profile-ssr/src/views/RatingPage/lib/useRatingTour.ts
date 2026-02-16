'use client';

import { useProductTour } from '@supreme-int/nextjs-shared/src/shared/hooks/useProductTour';
import { useEffect } from 'react';
import { getRatingTourSteps } from './tour-config';

const TOUR_COMPLETED_KEY = 'rating-tour-completed';

export const useRatingTour = () => {
  const { startTour } = useProductTour({steps: getRatingTourSteps(), onComplete: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'), onSkip: () => localStorage.setItem(TOUR_COMPLETED_KEY, 'true'), showProgress: true, allowClose: true});

  useEffect(() => {
    if (localStorage.getItem(TOUR_COMPLETED_KEY) === 'true') return;
    const timer = setTimeout(() => startTour(), 500);
    return () => clearTimeout(timer);
  }, [startTour]);

  return { startTour };
};
