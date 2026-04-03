// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }

export const authRoutes: AuthRoute[] = [
  { path: new RegExp('^/auth-ssr/.*$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/forgot-password-old$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/login-old$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/profile-old$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/profile-old/[^/]+$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/register-old$'), method: 'GET', auth_level: 'none' },
];
