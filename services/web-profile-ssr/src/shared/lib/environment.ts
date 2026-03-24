export const environment = {
  port: process.env.PORT || '3005',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  coreApplicationsUrl: process.env.CORE_APPLICATIONS_URL || 'http://localhost:8001/core-applications',
  coreClientInfoUrl: process.env.CORE_CLIENT_INFO_URL || 'http://localhost:8000/core-client-info',
};
