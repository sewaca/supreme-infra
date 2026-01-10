'use client';
import { createTheme } from '@mui/material/styles';
import { palette } from '@supreme-int/design-system/src/palette';
import { typography } from '@supreme-int/design-system/src/typography';

const theme = createTheme({
  palette,
  typography: { fontFamily: 'var(--font-roboto)', ...typography },
});

export default theme;
