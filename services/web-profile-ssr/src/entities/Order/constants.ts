import { i18n } from '@supreme-int/i18n';
import { ORDER_TYPE } from './Order';

export const ORDER_TYPE_LABELS: Record<string, string> = {
  [ORDER_TYPE.DORMITORY]: i18n('Общежитие'),
  [ORDER_TYPE.SCHOLARSHIP]: i18n('Стипендия'),
  [ORDER_TYPE.EDUCATION]: i18n('Обучение'),
  [ORDER_TYPE.GENERAL]: i18n('Общий'),
};
