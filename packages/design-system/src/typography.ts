/**
 * Типографика для MUI темы
 * Все размеры в rem (базовый размер браузера 16px)
 */
export const typography = {
  title1: {
    fontSize: '1.125rem', // 18px
    lineHeight: 1.112, // ~20px после округления браузером
    fontWeight: 500,
  },
  title2: {
    fontSize: '1rem', // 16px
    lineHeight: 1.25, // 20px
    fontWeight: 500,
  },
  title3: {
    fontSize: '0.875rem', // 14px
    lineHeight: 1.29, // ~18px
    fontWeight: 500,
  },
  body1: {
    fontSize: '1.125rem', // 18px
    lineHeight: 1.11, // ~20px
    fontWeight: 400,
  },
  body2: {
    fontSize: '1rem', // 16px
    lineHeight: 1.25, // 20px
    fontWeight: 400,
  },
  body3: {
    fontSize: '0.875rem', // 14px
    lineHeight: 1.29, // ~18px
    fontWeight: 400,
  },
} as const;
