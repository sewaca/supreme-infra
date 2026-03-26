import { i18n } from '@supreme-int/i18n';
import type { DriveStep } from 'driver.js';

export const getDormitoryTourSteps = (): DriveStep[] => [
  {
    element: '[data-tour="dormitory-hero"]',
    popover: {
      title: i18n('Информация о проживании'),
      description: i18n(
        'Здесь вы найдёте всю информацию о вашем проживании в общежитии: название, адрес и номер комнаты.',
      ),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="dormitory-contract"]',
    popover: {
      title: i18n('Договор о заселении'),
      description: i18n(
        'Договор, на основании которого принято решение о заселении. Нажмите, чтобы ознакомиться с документом.',
      ),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="dormitory-notifications"]',
    popover: {
      title: i18n('Уведомления'),
      description: i18n('Здесь появятся все важные объявления о вашем проживании в общежитии.'),
      side: 'top',
      align: 'start',
    },
  },
];
