export const environment = {
  port: process.env.PORT || '3007',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  coreMessagesUrl: process.env.CORE_MESSAGES_URL || 'http://localhost:8006/core-messages',
  coreClientInfoUrl: process.env.CORE_CLIENT_INFO_URL || 'http://localhost:8000/core-client-info',
  coreAuthUrl: process.env.CORE_AUTH_URL || 'http://localhost:8002/core-auth',
  filesStorageUrl: process.env.FILES_STORAGE_URL || 'http://localhost:8007/system-files-storage',
};
