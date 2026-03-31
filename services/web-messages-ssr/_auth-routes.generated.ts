// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute {
  path: RegExp;
  method?: string;
  auth_level: AuthLevel;
}

export const authRoutes: AuthRoute[] = [
  { path: /^\/api\/messages\/history$/, method: 'GET', auth_level: 'none' },
  { path: /^\/messages$/, method: 'GET', auth_level: 'none' },
  { path: /^\/messages\/[^/]+$/, method: 'GET', auth_level: 'none' },
  { path: /^\/messages\/broadcast$/, method: 'GET', auth_level: 'none' },
  { path: /^\/messages\/broadcast\/new$/, method: 'GET', auth_level: 'none' },
  { path: /^\/messages\/new$/, method: 'GET', auth_level: 'none' },
  { path: /^\/messages\/search$/, method: 'GET', auth_level: 'none' },
  { path: /^\/web-messages-ssr\/.*$/, method: 'GET', auth_level: 'none' },
];
