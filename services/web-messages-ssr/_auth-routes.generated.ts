// AUTO-GENERATED from router.yaml — DO NOT EDIT
// Run pnpm generate:router to regenerate

export type AuthLevel = 'none' | 'valid';
export interface AuthRoute { path: RegExp; method?: string; auth_level: AuthLevel; }

export const authRoutes: AuthRoute[] = [
  { path: new RegExp('^/api/messages/history$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/messages$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/messages/[^/]+$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/messages/broadcast$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/messages/broadcast/new$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/messages/new$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/messages/search$'), method: 'GET', auth_level: 'valid' },
  { path: new RegExp('^/web-messages-ssr/.*$'), method: 'GET', auth_level: 'none' },
];
