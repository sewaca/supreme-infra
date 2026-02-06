import { DriveStep, driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useEffect, useRef } from 'react';

export type TourStep = DriveStep;

type UseProductTourOptions = {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  allowClose?: boolean;
};

export const useProductTour = ({
  steps,
  onComplete,
  onSkip,
  showProgress = true,
  allowClose = true,
}: UseProductTourOptions) => {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  const startTour = () => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    driverRef.current = driver({
      showProgress,
      allowClose,
      steps,
      onDestroyed: (_element, _step, options) => {
        if (options.state.activeIndex === steps.length - 1) {
          onComplete?.();
        } else {
          onSkip?.();
        }
      },
    });

    driverRef.current.drive();
  };

  const stopTour = () => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  };

  return {
    startTour,
    stopTour,
  };
};
