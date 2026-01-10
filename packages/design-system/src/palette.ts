import type { PaletteOptions } from '@mui/material/styles';

/**
 * Палитра цветов для MUI темы
 * Использует прямые значения цветов из дизайн-системы
 * Стандартные названия цветов MUI переназначены на наиболее подходящие из дизайн-системы
 * Значения для светлой темы
 */
export const palette: PaletteOptions = {
  primary: {
    main: '#4ac2a8',
    light: '#74d6c2',
    dark: '#37948c',
    contrastText: '#fffffffa',
  },
  secondary: {
    main: '#777a85',
    light: '#989ca6',
    dark: '#505259',
    contrastText: '#000000db',
  },
  error: {
    main: '#ff4c52',
    light: '#f99',
    dark: '#e5434b',
    contrastText: '#fffffffa',
  },
  warning: {
    main: '#ed824c',
    light: '#eda77e',
    dark: '#c46031',
    contrastText: '#fffffffa',
  },
  info: {
    main: '#24a8e0',
    light: '#71cbf0',
    dark: '#188fc7',
    contrastText: '#fffffffa',
  },
  success: {
    main: '#56c776',
    light: '#8dd9a0',
    dark: '#2c9e56',
    contrastText: '#fffffffa',
  },
  text: {
    primary: '#000000db',
    secondary: '#00000080',
    disabled: '#0000004d',
  },
  background: {
    default: '#fff',
    paper: '#edeff2',
  },
  divider: '#00000014',
  action: {
    active: '#777a85',
    hover: '#c7c9cf',
    selected: '#777a85',
    disabled: '#edeff2',
    disabledBackground: '#f5f7f9',
    focus: '#777a85',
  },
} as const;
