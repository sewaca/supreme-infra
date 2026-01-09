import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { verifyJwt } from './verifyJwt';

describe('verifyJwt', () => {
  const secret = 'test-secret-key';

  it('should return true for valid JWT token', async () => {
    const secretKey = new TextEncoder().encode(secret);
    const token = await new SignJWT({ userId: '123' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secretKey);
    const result = await verifyJwt({ token, secret });
    expect(result).toBe(true);
  });

  it('should return false for invalid JWT token', async () => {
    const result = await verifyJwt({ token: 'invalid-token', secret });
    expect(result).toBe(false);
  });

  it('should return false for expired JWT token', async () => {
    const secretKey = new TextEncoder().encode(secret);
    const token = await new SignJWT({ userId: '123' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('0s')
      .sign(secretKey);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const result = await verifyJwt({ token, secret });
    expect(result).toBe(false);
  });

  it('should return false for token signed with different secret', async () => {
    const secretKey = new TextEncoder().encode('different-secret');
    const token = await new SignJWT({ userId: '123' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secretKey);
    const result = await verifyJwt({ token, secret });
    expect(result).toBe(false);
  });
});
