import { i18n } from '@supreme-int/i18n';
import type { TourStep } from '../../shared/hooks/useProductTour';

export const getSubjectsRankingTourSteps = (deadlineDate: string): TourStep[] => [
  {
    popover: {
      title: i18n('Сортировка дисциплин'),
      description: i18n(
        'На этой странице можно отсортировать дисциплины по приоритету. Дисциплина, которую выбрало наибольшее число студентов, будет проводиться на курсе.',
      ),
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="priority-input"]',
    popover: {
      title: i18n('Приоритет дисциплины'),
      description: i18n('Это поле отображает текущий приоритет дисциплины. 1 – наивысший приоритет, 4 – минимальный.'),
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="drag-handle"]',
    popover: {
      title: i18n('Перетаскивание'),
      description: i18n('Вы можете перетаскивать элементы с помощью drag & drop, удерживая эту иконку.'),
      side: 'left',
      align: 'center',
    },
  },
  {
    element: '[data-tour="save-button"]',
    popover: {
      title: i18n('Сохранение выбора'),
      description: i18n('Не забудьте сохранить свой выбор. Его можно будет изменить до {{date}}.', {
        date: deadlineDate,
      }),
      side: 'top',
      align: 'center',
    },
  },
];
