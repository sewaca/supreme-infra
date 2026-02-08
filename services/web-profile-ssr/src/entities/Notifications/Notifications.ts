export type NotificationSeverityLevel = 'error' | 'info' | 'success' | 'warning';
export type Notification = {
  severity: NotificationSeverityLevel;
  message: string;
  action?: string;
};
