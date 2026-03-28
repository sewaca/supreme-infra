// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute {
  path: RegExp;
  method?: string;
  auth_level: AuthLevel;
}

export const authRoutes: AuthRoute[] = [
  { path: /^\/$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/calendar$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/messages$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/news$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/web-schedule-ssr\/.*$/, method: 'GET', auth_level: 'none' },
];
