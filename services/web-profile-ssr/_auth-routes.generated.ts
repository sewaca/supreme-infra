// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }

export const authRoutes: AuthRoute[] = [
  { path: new RegExp('^/api/undefined-url$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/profile$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/data$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/dormitory$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/orders$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/rating$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/references$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/scholarship$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/scolarship$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/settings$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/settings/change-email$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/settings/change-password$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile/subjects-ranking$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/web-profile-ssr/.*$'), method: 'GET', auth_level: 'none' },
];
