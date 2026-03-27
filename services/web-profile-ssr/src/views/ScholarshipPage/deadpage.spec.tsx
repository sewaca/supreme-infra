import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { DeadPage } from './deadpage';

describe('DeadPage', () => {
  it('should render', () => {
    render(<DeadPage />);
  });
});
