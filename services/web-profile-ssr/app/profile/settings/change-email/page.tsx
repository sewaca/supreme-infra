export const dynamic = 'force-dynamic';

// biome-ignore lint/performance/noBarrelFile: App Router — страница реэкспортирует view из FSD как default.
export { ChangeEmailPage as default } from 'services/web-profile-ssr/src/views/SettingsPage/ChangeEmailPage';
