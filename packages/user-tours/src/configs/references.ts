import { i18n } from '@supreme-int/i18n';
import type { DriveStep } from 'driver.js';

export const getReferencesTourSteps = (): DriveStep[] => [
  {
    element: '[data-tour="reference-order-form"]',
    popover: {
      title: i18n('Заказ справок'),
      description: i18n(
        'Здесь можно заказать изготовление справки. Выберите тип справки, укажите место получения и дождитесь готовности.',
      ),
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="reference-type-input"]',
    popover: {
      title: i18n('Тип справки'),
      description: i18n('Выберите тип справки из списка или впишите свой, если нужного типа нет.'),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reference-pickup-select"]',
    popover: {
      title: i18n('Место получения'),
      description: i18n('Укажите, где хотите получить справку.'),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reference-virtual-checkbox"]',
    popover: {
      title: i18n('Виртуальная справка'),
      description: i18n(
        'Виртуальная справка будет доступна для скачивания в формате PDF. Если бумажная справка не нужна – просто кликните этот чекбокс.',
      ),
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reference-history"]',
    popover: {
      title: i18n('История заказов'),
      description: i18n('Все заказанные справки будут видны в истории.'),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="reference-status-filter"]',
    popover: {
      title: i18n('Фильтр по статусу'),
      description: i18n(
        'Здесь можно отфильтровать справки по статусу готовности. Виртуальные справки автоматически переходят в статус "Вручена"',
      ),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    popover: {
      title: i18n('Статус готовности'),
      description: i18n(
        'Внимательно следите за статусом справки и не забудьте забрать её до окончания срока хранения.',
      ),
      side: 'bottom',
      align: 'center',
    },
  },
];
