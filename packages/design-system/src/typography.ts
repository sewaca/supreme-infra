/**
 * Типографика для MUI темы
 * Все размеры в rem (базовый размер браузера 16px)
 */
export const typography = {
  headline0Bold: {
    fontSize: '8rem', // 128px
    lineHeight: 0.82,
    letterSpacing: '-0.075rem', // -1.2px
    fontWeight: 700,
  },
  headline1: {
    fontSize: '2rem', // 32px
    lineHeight: 1.06,
    letterSpacing: '-0.03125rem', // -0.5px
    fontWeight: 500,
  },
  headline1Bold: {
    fontSize: '2.5rem', // 40px
    lineHeight: 1,
    letterSpacing: '-0.0625rem', // -1px
    fontWeight: 700,
  },
  headline2: {
    fontSize: '1.625rem', // 26px
    lineHeight: 1.08,
    letterSpacing: '-0.03125rem', // -0.5px
    fontWeight: 500,
  },
  headline2Bold: {
    fontSize: '2.25rem', // 36px
    lineHeight: 1,
    letterSpacing: '-0.0625rem', // -1px
    fontWeight: 700,
  },
  headline3Bold: {
    fontSize: '3rem', // 48px
    lineHeight: 0.82,
    letterSpacing: 0,
    fontWeight: 800,
  },
  headline3: {
    fontSize: '1.375rem', // 22px
    lineHeight: 1.09,
    fontWeight: 500,
  },
  headline4: {
    fontSize: '1.25rem', // 20px
    lineHeight: 1.09,
    fontWeight: 500,
  },
} as const;
