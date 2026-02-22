import type { Notification } from '../Notifications/Notifications';

export const ORDER_TYPE = {
  DORMITORY: 'dormitory',
  SCHOLARSHIP: 'scholarship',
  EDUCATION: 'education',
  GENERAL: 'general',
} as const;

export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];

export type Order = {
  id: string;
  type: OrderType;
  number: string;
  title: string;
  date: string;
  comment: string;
  startDate: string;
  endDate: string;
  educationForm: string;
  educationType: string;
  direction: string;
  faculty: string;
  course: string;
  group: string;
  qualification: string;
  pdfUrl?: string;
  notifications?: Notification[];
};
