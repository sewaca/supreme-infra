// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute {
  path: RegExp;
  method?: string;
  auth_level: AuthLevel;
}

export const authRoutes: AuthRoute[] = [
  { path: /^\/api\/messages\/history$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/api\/upload$/, method: 'POST', auth_level: 'none' },
  { path: /^\/messages$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/messages\/[^/]+$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/messages\/broadcast$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/messages\/broadcast\/new$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/messages\/new$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/messages\/search$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/web-messages-ssr\/.*$/, method: 'GET', auth_level: 'none' },
];
