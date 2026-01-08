// import path from 'node:path';
import type { NextConfig } from 'next';

// const packagesDir = path.resolve(__dirname, '../../packages');

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  typedRoutes: true,
  // turbopack: {
  //   resolveAlias: {
  //     '@supreme-int/*': '../../packages/*/src',
  //   },
  // },
  // webpack: (config, { isServer }) => {
  //   if (isServer) {
  //     // Настраиваем алиасы для серверной части Next.js (для webpack режима)
  //     config.resolve.alias = {
  //       ...config.resolve.alias,
  //       '@supreme-int': packagesDir,
  //     };
  //   }
  //   return config;
  // },
  experimental: {
    serverComponentsExternalPackages: [
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
  },
};

export default nextConfig;
