/**
 * Типографика для MUI темы
 * Все размеры в rem (базовый размер браузера 16px)
 */
export const typography = {
  h0: {
    fontSize: '8rem', // 128px
    lineHeight: 0.82,
    letterSpacing: '-0.075rem', // -1.2px
    fontWeight: 700,
  },
  h1: {
    fontSize: '2rem', // 32px
    lineHeight: 1.06,
    letterSpacing: '-0.03125rem', // -0.5px
    fontWeight: 500,
  },
  // h1Bold: {
  //   fontSize: '2.5rem', // 40px
  //   lineHeight: 1,
  //   letterSpacing: '-0.0625rem', // -1px
  //   fontWeight: 700,
  // },
  h2: {
    fontSize: '1.625rem', // 26px
    lineHeight: 1.08,
    letterSpacing: '-0.03125rem', // -0.5px
    fontWeight: 500,
  },
  // h2Bold: {
  //   fontSize: '2.25rem', // 36px
  //   lineHeight: 1,
  //   letterSpacing: '-0.0625rem', // -1px
  //   fontWeight: 700,
  // },
  h3: {
    fontSize: '1.375rem', // 22px
    lineHeight: 1.09,
    fontWeight: 500,
  },
  // h3Bold: {
  //   fontSize: '3rem', // 48px
  //   lineHeight: 0.82,
  //   letterSpacing: 0,
  //   fontWeight: 800,
  // },
  h4: {
    fontSize: '1.25rem', // 20px
    lineHeight: 1.09,
    fontWeight: 500,
  },
  title1: {
    fontSize: '1.125rem', // 18px
    lineHeight: 1.112, // ~20px после округления браузером
    fontWeight: 600,
  },
  title2: {
    fontSize: '1rem', // 16px
    lineHeight: 1.25, // 20px
    fontWeight: 600,
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
