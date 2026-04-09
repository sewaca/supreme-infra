export const environment = {
  port: process.env.PORT || '3009',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  coreNewsUrl: process.env.CORE_NEWS_URL || 'http://localhost:8008/core-news',
  coreApplicationsUrl: process.env.CORE_APPLICATIONS_URL || 'http://localhost:8001/core-applications',
  coreClientInfoUrl: process.env.CORE_CLIENT_INFO_URL || 'http://localhost:8000/core-client-info',
  coreMessagesUrl: process.env.CORE_MESSAGES_URL || 'http://localhost:8006/core-messages',
};
