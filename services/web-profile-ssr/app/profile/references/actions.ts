'use server';

import { randomUUID } from 'node:crypto';
import { i18n } from '@supreme-int/i18n';
import { PICKUP_POINTS } from 'services/web-profile-ssr/src/entities/Reference/pickupPoints';
import type { OrderedReference } from 'services/web-profile-ssr/src/entities/Reference/Reference';

export type ReferenceTypeOption = { id: string; label: string };

export type ReferenceOrderOptions = {
  types: ReferenceTypeOption[];
  /** id типа справки → id точек выдачи, доступных для этого типа */
  pickupPointIdsByType: Record<string, string[]>;
  /** точки выдачи для произвольного типа (когда пользователь ввёл свой текст) */
  defaultPickupPointIds: string[];
};

const MOCK_ORDER_OPTIONS: ReferenceOrderOptions = {
  types: [
    { id: 'rdzd', label: i18n('РЖД') },
    { id: 'workplace', label: i18n('По месту работы') },
    { id: 'parents_workplace', label: i18n('По месту работы родителей') },
    { id: 'military', label: i18n('Для военкомата') },
    { id: 'scholarship', label: i18n('О стипендии') },
  ],
  pickupPointIdsByType: {
    rdzd: ['spbgt_hr', 'spbkt_hr'],
    workplace: ['spbgt_hr', 'spbkt_hr'],
    parents_workplace: ['spbgt_hr', 'spbkt_hr'],
    military: ['military_office'],
    scholarship: ['accounting'],
  },
  defaultPickupPointIds: ['spbgt_hr', 'spbkt_hr'],
};

export const getReferenceOrderOptions = async (): Promise<ReferenceOrderOptions> => {
  await new Promise((r) => setTimeout(r, 150));
  return { ...MOCK_ORDER_OPTIONS };
};

const MOCK_REFERENCES: OrderedReference[] = [
  {
    id: '1',
    type: 'workplace',
    typeLabel: 'По месту работы',
    status: 'ready',
    orderDate: '01.02.2025',
    pickupPoint: PICKUP_POINTS.spbgt_hr,
    virtualOnly: false,
    storageUntil: '15.03.2025',
    pdfUrl: 'https://pdfobject.com/pdf/sample.pdf',
  },
  {
    id: '2',
    type: 'rdzd',
    typeLabel: 'РЖД',
    status: 'ready',
    orderDate: '28.01.2025',
    pickupPoint: PICKUP_POINTS.spbkt_hr,
    virtualOnly: false,
    storageUntil: '14.02.2025',
    pdfUrl: '/api/references/sample',
  },
  {
    id: '3',
    type: 'parents_workplace',
    typeLabel: 'По месту работы родителей',
    status: 'ready',
    orderDate: '25.01.2025',
    pickupPoint: PICKUP_POINTS.spbgt_hr,
    virtualOnly: false,
    storageUntil: '13.02.2025',
    pdfUrl: '/api/references/sample',
  },
  {
    id: '4',
    type: 'scholarship',
    typeLabel: 'О стипендии',
    status: 'ready',
    orderDate: '20.01.2025',
    pickupPoint: PICKUP_POINTS.accounting,
    virtualOnly: true,
    storageUntil: '15.02.2025',
    pdfUrl: '/api/references/sample',
  },
  {
    id: '5',
    type: 'military',
    typeLabel: 'Для военкомата',
    status: 'ready',
    orderDate: '15.01.2025',
    pickupPoint: PICKUP_POINTS.military_office,
    virtualOnly: false,
    storageUntil: '14.02.2025',
    pdfUrl: '/api/references/sample',
  },
  {
    id: '6',
    type: 'rdzd',
    typeLabel: 'РЖД',
    status: 'in_progress',
    orderDate: '05.02.2025',
    pickupPoint: PICKUP_POINTS.spbkt_hr,
    virtualOnly: false,
    storageUntil: undefined,
    pdfUrl: undefined,
  },
  {
    id: '7',
    type: 'scholarship',
    typeLabel: 'О стипендии',
    status: 'pending',
    orderDate: '10.02.2025',
    pickupPoint: PICKUP_POINTS.accounting,
    virtualOnly: false,
    storageUntil: undefined,
    pdfUrl: 'https://pdfobject.com/pdf/sample.pdf',
  },
  {
    id: randomUUID(),
    type: 'custom',
    typeLabel: 'Да рандомная какая-то',
    status: 'pending',
    orderDate: '10.02.2025',
    pickupPoint: PICKUP_POINTS.accounting,
    virtualOnly: false,
    storageUntil: '18.02.2026',
    pdfUrl: 'https://pdfobject.com/pdf/sample.pdf',
  },
  {
    id: randomUUID(),
    type: 'custom',
    typeLabel: 'Да рандомная какая-то 2',
    status: 'pending',
    orderDate: '10.02.2025',
    pickupPoint: PICKUP_POINTS.accounting,
    virtualOnly: false,
    storageUntil: '13.02.2026',
    pdfUrl: 'https://pdfobject.com/pdf/sample.pdf',
  },
  {
    id: '8',
    type: 'workplace',
    typeLabel: 'По месту работы',
    status: 'preparation',
    orderDate: '11.02.2025',
    pickupPoint: PICKUP_POINTS.spbgt_hr,
    virtualOnly: false,
    storageUntil: undefined,
    pdfUrl: undefined,
  },
];

export const getReferences = async (): Promise<OrderedReference[]> => {
  await new Promise((r) => setTimeout(r, 150));
  return [...MOCK_REFERENCES];
};

export const orderReference = async (params: {
  type: string;
  pickupPointId?: string;
  virtualOnly: boolean;
}): Promise<{ success: boolean; error?: string }> => {
  await new Promise((r) => setTimeout(r, 500));
  console.log(`[references] order: ${JSON.stringify(params)}`);
  return { success: true };
};

export const cancelReference = async (referenceId: string): Promise<{ success: boolean; error?: string }> => {
  await new Promise((r) => setTimeout(r, 300));
  console.log(`[references] cancel: ${JSON.stringify(referenceId)}`);
  return { success: true };
};

export const extendStorage = async (referenceId: string): Promise<{ success: boolean; error?: string }> => {
  await new Promise((r) => setTimeout(r, 300));
  console.log(`[references] extend +2 days: ${JSON.stringify(referenceId)}`);
  return { success: true };
};
