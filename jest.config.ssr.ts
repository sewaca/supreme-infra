import baseJestConfig from './jest.config.global';

export const ssrJestConfig = {
  ...baseJestConfig,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
