export const REFERENCE_STATUS = {
  PREPARATION: 'preparation', // Подготовка
  IN_PROGRESS: 'in_progress', // В работе
  PENDING: 'pending', // Ожидает — можно отменить
  READY: 'ready', // Готова
} as const;

export type ReferenceStatus = (typeof REFERENCE_STATUS)[keyof typeof REFERENCE_STATUS];

export const REFERENCE_TYPE = {
  RZD: 'rdzd',
  WORKPLACE: 'workplace',
  PARENTS_WORKPLACE: 'parents_workplace',
  MILITARY: 'military',
  SCHOLARSHIP: 'scholarship',
} as const;

export type ReferenceType = (typeof REFERENCE_TYPE)[keyof typeof REFERENCE_TYPE] | 'custom';

export type PickupPoint = {
  id: string;
  name: string;
  address: string;
  room: string;
  phone?: string;
  note?: string;
};

export type OrderedReference = {
  id: string;
  type: ReferenceType;
  typeLabel: string;
  status: ReferenceStatus;
  orderDate: string;
  pickupPoint?: PickupPoint;
  virtualOnly: boolean;
  storageUntil?: string;
  pdfUrl?: string;
};
