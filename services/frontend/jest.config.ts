import { resolve } from 'node:path';
import { cwd } from 'node:process';

// Get absolute path to root directory
// When running from services/frontend, go up two levels to reach root
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const currentDir = (typeof __dirname !== 'undefined' ? __dirname : cwd());
const rootDir = resolve(currentDir, '../..');
const globalConfigPath = resolve(rootDir, 'jest.config.global.ts');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const baseJestConfig = require(globalConfigPath);

export default {
  ...baseJestConfig,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
};
