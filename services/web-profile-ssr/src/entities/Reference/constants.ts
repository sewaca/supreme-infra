import { i18n } from '@supreme-int/i18n';

export const REFERENCE_STATUS_LABELS: Record<string, string> = {
  preparation: i18n('Подготовка'),
  in_progress: i18n('В работе'),
  pending: i18n('Готова к получению'),
  ready: i18n('Вручена'),
};
