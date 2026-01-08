import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config.global';

export default mergeConfig(
  baseConfig,
  defineConfig({
    // biome-ignore lint/suspicious/noExplicitAny: TODO: не смог победить при переезде
    plugins: [swc.vite() as any],
    test: {
      environment: 'node',
      globals: true,
      setupFiles: ['reflect-metadata'],
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  }),
);
