import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: [
    './schemas/core-auth.json',
    './schemas/core-client-info.json',
    './schemas/core-applications.json',
    './schemas/core-schedule.json',
  ],
  output: [
    './src/generated/core-auth',
    './src/generated/core-client-info',
    './src/generated/core-applications',
    './src/generated/core-schedule',
  ],
});
