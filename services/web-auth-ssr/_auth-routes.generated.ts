// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }

export const authRoutes: AuthRoute[] = [
  { path: new RegExp('^/forgot-password$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/login$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/register$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/web-auth-ssr/.*$'), method: 'GET', auth_level: 'none' },
];
