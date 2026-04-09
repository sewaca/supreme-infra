import { i18n } from '@supreme-int/i18n/src/i18n';
import type { DriveStep } from 'driver.js';

export const getScheduleTourSteps = (): DriveStep[] => [
  {
    popover: {
      title: i18n('Расписание'),
      description: i18n('Давайте разберёмся, как пользоваться расписанием. Это займёт меньше минуты.'),
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="schedule-caldav-promo"]',
    popover: {
      title: i18n('Синхронизация с CalDAV'),
      description: i18n(
        'Нажмите на баннер, чтобы привязать расписание к стандартному приложению «Календарь» на вашем устройстве — занятия всегда будут у вас под рукой.',
      ),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="schedule-destination-tabs"]',
    popover: {
      title: i18n('Чьё расписание смотреть?'),
      description: i18n(
        'Вы смотрите своё расписание. Кнопки позволяют переключиться на расписание любой группы, конкретного преподавателя или расписание сессии.',
      ),
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="schedule-view-toggle"]',
    popover: {
      title: i18n('Режим отображения'),
      description: i18n(
        'Переключайтесь между режимами «Список» и «Календарь». Выбранный режим сохраняется автоматически.',
      ),
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="schedule-list-view"]',
    popover: {
      title: i18n('Список занятий'),
      description: i18n(
        'Занятия сгруппированы по дням недели. Стрелки слева и справа переключают недели. Нажмите на занятие, чтобы увидеть детали: аудиторию, преподавателя и тип пары.',
      ),
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="schedule-calendar-view"]',
    popover: {
      title: i18n('Вид «Календарь»'),
      description: i18n(
        'Занятия на сетке времени с 7:00 до 22:00. Листайте свайпом или стрелками. Переключайтесь между видами: неделя, 3 дня или день.',
      ),
      side: 'top',
      align: 'center',
    },
  },
  {
    popover: {
      title: i18n('Готово!'),
      description: i18n('Теперь вы знаете, как пользоваться расписанием. Удачной учёбы!'),
      side: 'bottom',
      align: 'center',
    },
  },
];
