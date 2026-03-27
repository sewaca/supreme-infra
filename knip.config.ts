import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    '**/*.generated.ts',
    '**/*.generated.tsx',
    '**/__mocks__/**',
    '**/node_modules/**',
    '**/vitest.setup.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    'services/*-ssr/proxy.ts',
    'e2e/*',
    'packages/api-client/src/generated/**',
    'services/frontend/**',
  ],
  workspaces: {
    '.': {
      entry: ['infra/**/*.{ts,mjs}', 'vitest.config.global.ts'],
      project: ['infra/**/*.{ts,mjs}'],
    },
    'services/frontend': {},
    'services/web-auth-ssr': {},
    'services/web-documents-ssr': {},
    'services/web-profile-ssr': {},
    'services/core-recipes-bff': {
      entry: ['src/main.ts', 'src/**/*.module.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/api-client': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
      // exclude: ['types'],
    },
    'packages/authorization-lib': {
      // No barrel index — files are imported by direct path
      entry: ['src/**/*.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/design-system': {
      entry: ['src/**/*.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}'],
    },
    'packages/i18n': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/instrumentation': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/lib': {
      entry: ['src/**/*.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/nestjs-shared': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/nextjs-shared': {
      entry: ['src/**/*.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}'],
    },
    'packages/user-tours': {
      entry: ['src/**/*.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}'],
    },
    // e2e: {
    //   entry: ['playwright.config.ts', 'run-e2e.ts', 'mock-server.ts', 'mocks.ts', 'tests/**/*.spec.ts'],
    //   project: ['**/*.ts'],
    // },
  },
};

export default config;
