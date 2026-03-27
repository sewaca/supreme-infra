// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute {
  path: RegExp;
  method?: string;
  auth_level: AuthLevel;
}

export const authRoutes: AuthRoute[] = [
  { path: /^\/forgot-password$/, method: 'GET', auth_level: 'none' },
  { path: /^\/login$/, method: 'GET', auth_level: 'none' },
  { path: /^\/profile-old$/, method: 'GET', auth_level: 'none' },
  { path: /^\/register$/, method: 'GET', auth_level: 'none' },
  { path: /^\/web-auth-ssr\/.*$/, method: 'GET', auth_level: 'none' },
];
