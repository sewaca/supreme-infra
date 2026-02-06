import type { CSSProperties } from 'react';

export type TypographyVariantsType = {
  title1: CSSProperties;
  title2: CSSProperties;
  title3: CSSProperties;
  body1: CSSProperties;
  body2: CSSProperties;
  body3: CSSProperties;
  h0: CSSProperties;
};

export type TypographyPropsVariantOverridesType = {
  title1: true;
  title2: true;
  title3: true;
  body1: true;
  body2: true;
  body3: true;
  h0: true;
};

declare module '@mui/material/styles' {
  interface TypographyVariants extends TypographyVariantsType {}
  interface TypographyVariantsOptions extends Partial<TypographyVariantsType> {}
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides extends TypographyPropsVariantOverridesType {}
}
