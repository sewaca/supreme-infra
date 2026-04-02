// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }

export const authRoutes: AuthRoute[] = [
  { path: new RegExp('^/api/caldav-setup$'), method: 'POST', auth_level: 'valid' },
  { path: new RegExp('^/api/schedule$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/schedule$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/schedule/group$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/schedule/teacher$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/web-schedule-ssr/.*$'), method: 'GET', auth_level: 'none' },
];
