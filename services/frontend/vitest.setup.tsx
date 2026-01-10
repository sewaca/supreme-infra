
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

vi.mock('*.svg', () => ({
  default: (props: Record<string, unknown>) => <svg {...props} />,
}));
