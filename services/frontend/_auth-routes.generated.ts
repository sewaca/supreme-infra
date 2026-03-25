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
  { path: /^\/frontend\/.*$/, method: 'GET', auth_level: 'none' },
  { path: /^\/proposed-recipes$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/recipes\/[^/]+$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/submit-recipe$/, method: 'GET', auth_level: 'valid' },
];
