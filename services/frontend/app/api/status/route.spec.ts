import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('Status API Route', () => {
  it('should return ok status', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({ status: 'ok' });
    expect(response.status).toBe(200);
  });
});

