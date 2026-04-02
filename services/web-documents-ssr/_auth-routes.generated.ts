// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }

export const authRoutes: AuthRoute[] = [
  { path: new RegExp('^/documents/gradebook$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/documents/student-id-card$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/web-documents-ssr/.*$'), method: 'GET', auth_level: 'none' },
];
