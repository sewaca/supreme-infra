'use client';
import { createTheme } from '@mui/material/styles';
import { typography } from '@supreme-int/design-system/src/typography';

const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-roboto)',
    ...typography,
  },
});

export default theme;
