import type { CSSProperties } from 'react';

export type TypographyVariantsType = {
  headline0Bold: CSSProperties;
  headline1: CSSProperties;
  headline1Bold: CSSProperties;
  headline2: CSSProperties;
  headline2Bold: CSSProperties;
  headline3Bold: CSSProperties;
  headline3: CSSProperties;
  headline4: CSSProperties;
};

export type TypographyPropsVariantOverridesType = {
  headline0Bold: true;
  headline1: true;
  headline1Bold: true;
  headline2: true;
  headline2Bold: true;
  headline3Bold: true;
  headline3: true;
  headline4: true;
};

declare module '@mui/material/styles' {
  interface TypographyVariants extends TypographyVariantsType {}
  interface TypographyVariantsOptions extends Partial<TypographyVariantsType> {}
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides extends TypographyPropsVariantOverridesType {}
}
