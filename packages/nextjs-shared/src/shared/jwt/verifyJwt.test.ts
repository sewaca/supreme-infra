import { verifyJwt as verifyJwtCore } from '@supreme-int/authorization-lib/src/jwt/verify-jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyJwt } from './verifyJwt';

vi.mock('@supreme-int/authorization-lib/src/jwt/verify-jwt', () => ({
  verifyJwt: vi.fn(),
}));

describe('verifyJwt', () => {
  beforeEach(() => {
    vi.mocked(verifyJwtCore).mockReset();
  });

  it('should return true when authorization-lib reports valid', async () => {
    vi.mocked(verifyJwtCore).mockResolvedValue({ valid: true, durationMs: 0 });
    const result = await verifyJwt({ token: 'token', secret: 'secret' });
    expect(result).toBe(true);
    expect(vi.mocked(verifyJwtCore)).toHaveBeenCalledWith({ token: 'token', secret: 'secret' });
  });

  it('should return false when authorization-lib reports invalid', async () => {
    vi.mocked(verifyJwtCore).mockResolvedValue({ valid: false, durationMs: 0 });
    const result = await verifyJwt({ token: 'token', secret: 'secret' });
    expect(result).toBe(false);
  });
});
