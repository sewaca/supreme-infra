import { i18n } from '@supreme-int/i18n';
import type { DriveStep } from 'driver.js';

export const getOrdersTourSteps = (): DriveStep[] => [
  { element: '[data-tour="orders-filters"]', popover: { title: i18n('Фильтры приказов'), description: i18n('Выбери тип приказа для просмотра: общежитие, стипендия, обучение или общие. Можно выбрать несколько типов одновременно или показать все.'), side: 'bottom', align: 'center' } },
  { element: '[data-tour="orders-list"]', popover: { title: i18n('Список приказов'), description: i18n('Здесь отображаются все твои приказы. Кликни на приказ, чтобы посмотреть детальную информацию. Значок колокольчика показывает наличие уведомлений.'), side: 'bottom', align: 'center' } },
  { popover: { title: i18n('Готово!'), description: i18n('Теперь ты можешь просматривать все свои приказы, скачивать их в PDF и отслеживать важные уведомления.'), side: 'bottom', align: 'center' } },
];
