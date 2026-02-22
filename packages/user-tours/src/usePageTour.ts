'use client';

import type { DriveStep } from 'driver.js';
import { useEffect } from 'react';
import { getOrdersTourSteps } from './configs/orders';
import { getRatingTourSteps } from './configs/rating';
import { getReferencesTourSteps } from './configs/references';
import { getSubjectsRankingTourSteps } from './configs/subjects-ranking';
import { useProductTour } from './useProductTour';

export type PageTourType = 'orders' | 'rating' | 'references' | 'subjects-ranking';

type TourConfig = { key: string; steps: DriveStep[] };

type PageTourOptions = { page: PageTourType; params?: Record<string, unknown>; autoStart?: boolean };

const getTourConfig = (page: PageTourType, params?: Record<string, unknown>): TourConfig => {
  switch (page) {
    case 'orders':
      return { key: 'orders-tour-completed', steps: getOrdersTourSteps() };
    case 'rating':
      return { key: 'rating-tour-completed', steps: getRatingTourSteps() };
    case 'references':
      return { key: 'references-tour-completed', steps: getReferencesTourSteps() };
    case 'subjects-ranking':
      return {
        key: 'subjects-ranking-tour-completed',
        steps: getSubjectsRankingTourSteps((params?.deadlineDate as string) || ''),
      };
    default:
      throw new Error(`Unknown page tour type: ${page}`);
  }
};

export const usePageTour = ({ page, params, autoStart = true }: PageTourOptions) => {
  const config = getTourConfig(page, params);

  const { startTour } = useProductTour({
    steps: config.steps,
    onComplete: () => localStorage.setItem(config.key, 'true'),
    onSkip: () => localStorage.setItem(config.key, 'true'),
    showProgress: true,
    allowClose: true,
  });

  useEffect(() => {
    if (!autoStart) return;
    if (localStorage.getItem(config.key) === 'true') return;

    const timer = setTimeout(() => startTour(), 500);
    return () => clearTimeout(timer);
  }, [startTour, autoStart, config.key]);

  return { startTour };
};
