// Instrumentation should only run in Node.js runtime, not Edge Runtime
// Check Next.js runtime environment variable
export async function register() {
  console.log(
    '[debug] inside register. NEXT_RUNTIME = ',
    process.env.NEXT_RUNTIME,
  );
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.nodejs');
  }
}
