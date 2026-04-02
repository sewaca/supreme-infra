// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }

export const authRoutes: AuthRoute[] = [
  { path: new RegExp('^/$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/frontend/.*$'), method: 'GET', auth_level: 'none' },
  { path: new RegExp('^/profile-old$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/proposed-recipes$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/recipes/[^/]+$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/submit-recipe$'), method: 'GET', auth_level: 'valid' },
];
