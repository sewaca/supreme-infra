import type { PickupPoint } from './Reference';

export const WORKING_HOURS = '12:00 – 16:00';

/**
 * Маппинг id точки выдачи → данные для отображения.
 * Список доступных точек для типа справки приходит с бекенда (getReferenceOrderOptions).
 */
export const PICKUP_POINTS: Record<string, PickupPoint> = {
  spbgt_hr: {
    id: 'spbgt_hr',
    name: 'Студенческий отдел кадров СПбГУТ',
    address: 'пр. Большевиков, д.22',
    room: 'каб. 602/1',
    note: WORKING_HOURS,
  },
  spbkt_hr: {
    id: 'spbkt_hr',
    name: 'Студенческий отдел кадров СПбКТ',
    address: 'наб. реки Мойки, 61',
    room: 'каб. 260',
    phone: '323-16-68',
    note: WORKING_HOURS,
  },
  military_office: {
    id: 'military_office',
    name: 'Для военкомата',
    address: 'пр. Большевиков, д.22',
    room: 'каб. 227/1',
    note: `Достигшим 18 лет с регистрацией в СПб/Лен. обл. ${WORKING_HOURS}`,
  },
  accounting: {
    id: 'accounting',
    name: 'Бухгалтерия (о стипендии)',
    address: 'пр. Большевиков, 22',
    room: 'ком. 625/1',
    note: `Справка заказывается и выдаётся в бухгалтерии. ${WORKING_HOURS}`,
  },
};
