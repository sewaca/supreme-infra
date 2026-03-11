import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: ['./schemas/core-client-info.json', './schemas/core-applications.json'],
  output: ['./src/core-client-info', './src/core-applications'],
});
