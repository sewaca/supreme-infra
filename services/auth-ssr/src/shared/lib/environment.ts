export function getCoreAuthUrl(): string {
  return process.env.CORE_AUTH_URL || 'http://localhost:8002/core-auth';
}
