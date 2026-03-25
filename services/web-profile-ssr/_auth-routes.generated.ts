// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute {
  path: RegExp;
  method?: string;
  auth_level: AuthLevel;
}

export const authRoutes: AuthRoute[] = [
  { path: /^\/api\/undefined-url$/, method: 'GET', auth_level: 'none' },
  { path: /^\/profile$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/data$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/dormitory$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/orders$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/rating$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/references$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/scholarship$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/scolarship$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/settings$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/profile\/subjects-ranking$/, method: 'GET', auth_level: 'valid' },
  { path: /^\/web-profile-ssr\/.*$/, method: 'GET', auth_level: 'none' },
];
