import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /web-recipes/api/status', () => {
  it('should return status ok', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({ status: 'ok', service: 'frontend' });
    expect(response.status).toBe(200);
  });
});
