const isProd = process.env.NODE_ENV === 'production';

export function getCoreAuthUrl(): string {
  if (!isProd) {
    return 'http://localhost:8002/core-auth';
  }
  const namespace = process.env.BACKEND_SERVICE_NAMESPACE ?? process.env.POD_NAMESPACE;
  return `http://core-auth.${namespace}.svc.cluster.local/core-auth`;
}
