'use client';
import { createTheme } from '@mui/material/styles';
import { components } from '@supreme-int/design-system/src/shared/mui/components';
import { palette } from '@supreme-int/design-system/src/shared/mui/palette';
import { typography } from '@supreme-int/design-system/src/shared/mui/typography';

const theme = createTheme({
  palette,
  typography: { fontFamily: 'var(--font-roboto)', ...typography },
  components,
});

export default theme;
