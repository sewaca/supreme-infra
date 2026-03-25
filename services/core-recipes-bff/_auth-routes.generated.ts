// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute {
  path: RegExp;
  method?: string;
  auth_level: AuthLevel;
}

export const authRoutes: AuthRoute[] = [
  { path: /^\/core-recipes-bff\/api\/status$/, method: 'GET', auth_level: 'none' },
  { path: /^\/core-recipes-bff\/recipes$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/core-recipes-bff\/recipes\/[^/]+$/, method: 'DELETE', auth_level: 'valid' },
  { path: /^\/core-recipes-bff\/recipes\/[^/]+$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/core-recipes-bff\/recipes\/[^/]+$/, method: 'PUT', auth_level: 'valid' },
  { path: /^\/core-recipes-bff\/recipes\/[^/]+\/like$/, method: 'POST', auth_level: 'valid' },
  { path: /^\/core-recipes-bff\/recipes\/propose$/, method: 'POST', auth_level: 'valid' },
  { path: /^\/core-recipes-bff\/recipes\/proposed\/[^/]+\/publish$/, method: 'POST', auth_level: 'valid' },
  { path: /^\/core-recipes-bff\/recipes\/proposed\/all$/, method: 'GET', auth_level: 'valid' },
];
