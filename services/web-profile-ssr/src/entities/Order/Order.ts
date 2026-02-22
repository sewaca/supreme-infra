import type { Notification } from '../Notifications/Notifications';

export const ORDER_TYPE = {
  DORMITORY: 'dormitory',
  SCHOLARSHIP: 'scholarship',
  EDUCATION: 'education',
  GENERAL: 'general',
} as const;

export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];

export type OrderAction = {
  title: string;
  action: string;
};

export type Order = {
  id: string;
  type: OrderType;
  number: string;
  title: string;
  date: string;
  additionalFields?: Record<string, string>;
  pdfUrl?: string;
  notifications?: Notification[];
  actions?: {
    primary?: OrderAction;
    secondary?: OrderAction;
  };
};
