export const environment = {
  port: process.env.PORT || '3007',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  coreMessagesUrl: process.env.CORE_MESSAGES_URL || 'http://core-messages.default.svc.cluster.local/core-messages',
  coreClientInfoUrl:
    process.env.CORE_CLIENT_INFO_URL || 'http://core-client-info.default.svc.cluster.local/core-client-info',
  coreAuthUrl: process.env.CORE_AUTH_URL || 'http://core-auth.default.svc.cluster.local/core-auth',
};
