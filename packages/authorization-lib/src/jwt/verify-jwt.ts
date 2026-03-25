import { jwtVerify } from 'jose';
import { jwtVerifyDuration, jwtVerifyTotal } from '../metrics/auth-metrics';

export type JwtVerifyResult = {
  valid: boolean;
  durationMs: number;
};

export async function verifyJwt({ token, secret }: { token: string; secret: string }): Promise<JwtVerifyResult> {
  const start = performance.now();

  try {
    const secretKey = new TextEncoder().encode(secret);
    await jwtVerify(token, secretKey);
    const durationMs = performance.now() - start;

    jwtVerifyDuration.record(durationMs, { result: 'valid' });
    jwtVerifyTotal.add(1, { result: 'valid' });

    return { valid: true, durationMs };
  } catch {
    const durationMs = performance.now() - start;

    jwtVerifyDuration.record(durationMs, { result: 'invalid' });
    jwtVerifyTotal.add(1, { result: 'invalid' });

    return { valid: false, durationMs };
  }
}
