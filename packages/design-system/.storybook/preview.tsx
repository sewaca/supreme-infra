import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import type { Preview } from '@storybook/react';
import { components } from '../src/shared/mui/components';
import { palette } from '../src/shared/mui/palette';
import { typography } from '../src/shared/mui/typography';
import '../src/font.css';
import '../src/theme.css';
import '../src/variables.css';

const theme = createTheme({ palette, typography, components });

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#edeff2' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
