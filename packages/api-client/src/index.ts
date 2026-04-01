// biome-ignore lint/performance/noBarrelFile: TODO: remove barrel import
export * from './base-api';
export * from './core-auth-bff';
export * from './core-recipes-bff';
export * as CoreApplications from './generated/core-applications';
export * as CoreAuth from './generated/core-auth';
// FastAPI generated clients - use namespaced imports to avoid conflicts
export * as CoreClientInfo from './generated/core-client-info';
export * as CoreMessages from './generated/core-messages';
export * as CoreSchedule from './generated/core-schedule';
export * as SystemFilesStorage from './system-files-storage';
