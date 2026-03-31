import { i18n } from '@supreme-int/i18n/src/i18n';
import type { DriveStep } from 'driver.js';

export const getScholarshipTourSteps = (): DriveStep[] => [
  {
    element: '[data-tour="scholarship-hero"]',
    popover: {
      title: i18n('Информация о стипендии'),
      description: i18n(
        'Здесь вы найдёте всю актуальную информацию о вашей стипендии: сумму ежемесячной выплаты и срок действия.',
      ),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="scholarship-contract"]',
    popover: {
      title: i18n('Основание выплаты'),
      description: i18n(
        'Приказ, на основании которого принято решение о назначении стипендии. Нажмите, чтобы ознакомиться с документом.',
      ),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="scholarship-notifications"]',
    popover: {
      title: i18n('Уведомления'),
      description: i18n('Здесь появятся все важные объявления, связанные с вашей стипендией.'),
      side: 'top',
      align: 'start',
    },
  },
];
