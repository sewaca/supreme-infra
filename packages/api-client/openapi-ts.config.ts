import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: ['./schemas/core-auth.json', './schemas/core-client-info.json', './schemas/core-applications.json'],
  output: ['./src/core-auth', './src/core-client-info', './src/core-applications'],
});
