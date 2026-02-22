import type { Order } from './Order';
import { ORDER_TYPE } from './Order';

const generateDormitoryOrders = (): Order[] =>
  Array.from({ length: 50 }, (_, i) => ({
    id: i === 0 ? 'b6e6fcb9-6a5f-46b0-9060-601bc48f8954' : `dormitory-${i + 1}`,
    type: ORDER_TYPE.DORMITORY,
    number: `${100 + i}/д`,
    title: 'Заселение в общежитие',
    date: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-2026`,
    additionalFields: {
      'order.field.comment': `№${100 + i}/д от ${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}.2026`,
      'order.field.startDate': '01-09-2025',
      'order.field.endDate': '30-06-2026',
      'order.field.educationForm': 'Очная',
      'order.field.educationType': 'Бюджет',
      'order.field.direction': '09.03.04 - Программная инженерия',
      'order.field.faculty': 'ИТПИ',
      'order.field.course': '4',
      'order.field.group': `ИКПИ-${20 + i}`,
      'order.field.qualification': 'Бакалавр',
    },
    pdfUrl: `/api/orders/dormitory-${i + 1}/pdf`,
    actions: {
      primary: {
        title: 'Скачать приказ в PDF',
        action: `deeplink://common/download_file?fileUrl=/api/orders/dormitory-${i + 1}/pdf`,
      },
    },
    notifications:
      i % 5 === 0
        ? [
            {
              severity: 'warning' as const,
              message: 'Необходимо оплатить задолженность 2 000 ₽',
              action: '/undefined-url',
            },
            {
              severity: 'error' as const,
              message: 'Нужно загрузить согласие от родителей',
              action: `deeplink://dormitory/parent_agreement/upload_file?applicationId=dormitory-${i + 1}`,
            },
          ]
        : undefined,
  }));

const generateScholarshipOrders = (): Order[] =>
  Array.from({ length: 50 }, (_, i) => ({
    id: `scholarship-${i + 1}`,
    type: ORDER_TYPE.SCHOLARSHIP,
    number: `${250 + i}/кс`,
    title: 'Назначить стипендию',
    date: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-2026`,
    additionalFields: {
      'order.field.comment': `№${250 + i}/кс от ${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}.2026\nГАС ИТПИ ${i % 2 === 0 ? '1' : '2'} сем 25/26`,
      'order.field.startDate': '01-02-2026',
      'order.field.endDate': '30-04-2026',
      'order.field.educationForm': 'Очная',
      'order.field.educationType': 'Бюджет',
      'order.field.direction': '09.03.04 - Программная инженерия',
      'order.field.faculty': 'ИТПИ',
      'order.field.course': '4',
      'order.field.group': `ИКПИ-${20 + i}`,
      'order.field.qualification': 'Бакалавр',
    },
    pdfUrl: `/api/orders/scholarship-${i + 1}/pdf`,
    actions: {
      primary: {
        title: 'Скачать приказ в PDF',
        action: `deeplink://common/download_file?fileUrl=/api/orders/scholarship-${i + 1}/pdf`,
      },
    },
    notifications:
      i % 7 === 0
        ? [{ severity: 'info' as const, message: 'Стипендия будет начислена 15 числа', action: undefined }]
        : undefined,
  }));

const generateEducationOrders = (): Order[] =>
  Array.from({ length: 50 }, (_, i) => ({
    id: `education-${i + 1}`,
    type: ORDER_TYPE.EDUCATION,
    number: `${400 + i}/о`,
    title: 'О зачислении',
    date: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-2026`,
    additionalFields: {
      'order.field.comment': `№${400 + i}/о от ${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}.2026`,
      'order.field.startDate': '01-09-2025',
      'order.field.endDate': '30-06-2030',
      'order.field.educationForm': 'Очная',
      'order.field.educationType': 'Бюджет',
      'order.field.direction': '09.03.04 - Программная инженерия',
      'order.field.faculty': 'ИТПИ',
      'order.field.course': '4',
      'order.field.group': `ИКПИ-${20 + i}`,
      'order.field.qualification': 'Бакалавр',
    },
    pdfUrl: `/api/orders/education-${i + 1}/pdf`,
    actions: {
      primary: {
        title: 'Скачать приказ в PDF',
        action: `deeplink://common/download_file?fileUrl=/api/orders/education-${i + 1}/pdf`,
      },
    },
    notifications:
      i % 10 === 0
        ? [{ severity: 'error' as const, message: 'Необходимо загрузить документы', action: '/profile/data' }]
        : undefined,
  }));

const generateGeneralOrders = (): Order[] =>
  Array.from({ length: 50 }, (_, i) => ({
    id: `general-${i + 1}`,
    type: ORDER_TYPE.GENERAL,
    number: `${600 + i}/п`,
    title: 'Общий приказ',
    date: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-2026`,
    additionalFields: {
      'order.field.comment': `№${600 + i}/п от ${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}.2026`,
      'order.field.startDate': '01-01-2026',
      'order.field.endDate': '31-12-2026',
      'order.field.educationForm': 'Очная',
      'order.field.educationType': 'Бюджет',
      'order.field.direction': '09.03.04 - Программная инженерия',
      'order.field.faculty': 'ИТПИ',
      'order.field.course': '4',
      'order.field.group': `ИКПИ-${20 + i}`,
      'order.field.qualification': 'Бакалавр',
    },
    pdfUrl: `/api/orders/general-${i + 1}/pdf`,
    actions: {
      primary: {
        title: 'Скачать приказ в PDF',
        action: `deeplink://common/download_file?fileUrl=/api/orders/general-${i + 1}/pdf`,
      },
    },
    notifications:
      i % 8 === 0
        ? [{ severity: 'success' as const, message: 'Приказ успешно выполнен', action: undefined }]
        : undefined,
  }));

export const MOCK_ORDERS: Order[] = [
  ...generateDormitoryOrders(),
  ...generateScholarshipOrders(),
  ...generateEducationOrders(),
  ...generateGeneralOrders(),
];
