import { i18n } from '@supreme-int/i18n';
import type { DriveStep } from 'driver.js';

export const getScholarshipTourSteps = (): DriveStep[] => [
  {
    element: '[data-tour="scholarship-info"]',
    popover: {
      title: i18n('Информация о стипендии'),
      description: i18n('Здесь отображаются актуальная сумма, период действия и связанные уведомления.'),
      side: 'bottom',
      align: 'start',
    },
  },
];
