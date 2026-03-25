import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('authorization-lib', '1.0.0');

export const jwtVerifyDuration = meter.createHistogram('auth_jwt_verify_duration_ms', {
  description: 'Duration of JWT verification in milliseconds',
  unit: 'ms',
});

export const jwtVerifyTotal = meter.createCounter('auth_jwt_verify_total', {
  description: 'Total number of JWT verifications by result',
});

export const sessionCheckDuration = meter.createHistogram('auth_session_check_duration_ms', {
  description: 'Duration of session check via core-auth in milliseconds',
  unit: 'ms',
});

export const sessionCheckTotal = meter.createCounter('auth_session_check_total', {
  description: 'Total number of session checks by status',
});
