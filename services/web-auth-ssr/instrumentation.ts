import { setupUniversityNewsFetching } from './src/shared/api/universityNews';

export async function register() {
  setupUniversityNewsFetching();

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.nodejs');
  }
}

// biome-ignore lint/performance/noBarrelFile: Next.js требует корневой `instrumentation.ts`; `onRequestError` объявлен в edge-only модуле.
export { onRequestError } from './instrumentation.edge';
