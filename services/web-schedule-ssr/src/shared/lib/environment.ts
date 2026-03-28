export const environment = {
  port: process.env.PORT || '3006',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  coreScheduleUrl: process.env.CORE_SCHEDULE_URL || 'http://localhost:8003/core-schedule',
  coreClientInfoUrl: process.env.CORE_CLIENT_INFO_URL || 'http://localhost:8000/core-client-info',
};
