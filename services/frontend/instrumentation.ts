export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.nodejs');
  }
}

// Импортируем onRequestError из отдельного файла
export { onRequestError } from './instrumentation.edge';
