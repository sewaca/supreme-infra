import { defineConfig } from '@hey-api/openapi-ts';

const services = [
  'core-auth',
  'core-client-info',
  'core-applications',
  'core-schedule',
  'core-messages',
  'system-files-storage',
  'core-news',
] as const;

export default defineConfig(
  services.map((name) => ({
    input: `./schemas/${name}.json`,
    output: `./src/generated/${name}`,
    plugins: [
      {
        name: '@hey-api/client-fetch' as const,
        // relative to the generated client.gen.ts (src/generated/{name}/)
        runtimeConfigPath: `../../client-configs/${name}`,
      },
    ],
  })),
);
