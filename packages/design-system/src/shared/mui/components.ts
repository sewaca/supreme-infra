import type { PaletteColorOptions, ThemeOptions } from '@mui/material/styles';
import { palette } from './palette';

const takeContrastText = (color?: PaletteColorOptions) =>
  color && 'contrastText' in color ? color.contrastText : undefined;

/**
 * Кастомизация компонентов MUI для темы
 * Настройки компонентов, которые должны применяться во всех сервисах
 */
export const components: Readonly<ThemeOptions['components']> = {
  MuiAlert: {
    styleOverrides: {
      filledSuccess: { color: takeContrastText(palette.success) },
      filledError: { color: takeContrastText(palette.error) },
      filledWarning: { color: takeContrastText(palette.warning) },
      filledInfo: { color: takeContrastText(palette.info) },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: ({ ownerState }) => {
        if (typeof ownerState.elevation !== 'number') {
          return {};
        }

        if (ownerState.elevation <= 1) {
          return { backgroundColor: '#ffffff' };
        }

        if (ownerState.elevation <= 3) {
          return { backgroundColor: '#f9f9f9' };
        }

        return { backgroundColor: '#f2f4f7' };
      },
    },
  },
};
