import { createNextInstrumentation } from '@supreme-int/instrumentation';

createNextInstrumentation({
  serviceName: 'auth-ssr',
  serviceVersion: '1.0.0',
  metricsPort: 9464,
});
