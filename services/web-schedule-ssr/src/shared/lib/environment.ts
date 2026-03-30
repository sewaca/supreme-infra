export const environment = {
  port: process.env.PORT || '3006',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  coreScheduleUrl: process.env.CORE_SCHEDULE_URL || 'http://core-schedule.default.svc.cluster.local/core-schedule',
  coreClientInfoUrl:
    process.env.CORE_CLIENT_INFO_URL || 'http://core-client-info.default.svc.cluster.local/core-client-info',
  coreAuthUrl: process.env.CORE_AUTH_URL || 'http://core-auth.default.svc.cluster.local/core-auth',
  /** Public base URL for CalDAV feeds (accessible from user's device) */
  caldavBaseUrl: process.env.CALDAV_BASE_URL || 'https://diploma.sewaca.ru/core-schedule/caldav',
};
