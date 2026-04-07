export function getCoreAuthUrl(): string {
  return process.env.CORE_AUTH_URL || 'http://localhost:8002/core-auth';
}

export function getCoreNewsUrl(): string {
  return process.env.CORE_NEWS_URL || 'http://localhost:8008/core-news';
}
