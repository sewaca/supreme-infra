export const environment = {
  port: process.env.PORT || '3006',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  coreScheduleUrl: process.env.CORE_SCHEDULE_URL || 'http://localhost:8003/core-schedule',
  coreClientInfoUrl: process.env.CORE_CLIENT_INFO_URL || 'http://localhost:8000/core-client-info',
  coreAuthUrl: process.env.CORE_AUTH_URL || 'http://localhost:8002/core-auth',
  coreMessagesUrl: process.env.CORE_MESSAGES_URL || 'http://localhost:8006/core-messages',
  /** Public base URL for CalDAV feeds (accessible from user's device) */
  caldavBaseUrl: process.env.CALDAV_BASE_URL || 'https://diploma.sewaca.ru/core-schedule/caldav',
};
