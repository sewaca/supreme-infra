import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  typedRoutes: true,
  serverExternalPackages: [
    '@opentelemetry/api',
    '@opentelemetry/core',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-node',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/sdk-logs',
    '@opentelemetry/api-logs',
    '@opentelemetry/sdk-metrics',
    '@opentelemetry/semantic-conventions',
    '@opentelemetry/instrumentation',
    '@opentelemetry/instrumentation-fs',
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/instrumentation-graphql',
    '@opentelemetry/instrumentation-runtime-node',
    '@opentelemetry/instrumentation-undici',
    '@opentelemetry/host-metrics',
    '@opentelemetry/propagator-b3',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/exporter-prometheus',
  ],
};

export default nextConfig;
