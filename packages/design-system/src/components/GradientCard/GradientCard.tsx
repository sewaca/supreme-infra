import { Box, type BoxProps } from '@mui/material';
import type { ReactNode } from 'react';

const GRADIENTS = {
  blue: 'linear-gradient(135deg, #2b4878 0%, #1a2e4a 100%)',
  green: 'linear-gradient(135deg, #1a6651 0%, #0e3d31 100%)',
  yellow: 'linear-gradient(135deg, #b8860b 0%, #7a5800 100%)',
  orange: 'linear-gradient(135deg, #d4520c 0%, #8b3000 100%)',
  red: 'linear-gradient(135deg, #c0392b 0%, #7d2418 100%)',
  purple: 'linear-gradient(135deg, #6b21a8 0%, #3b0764 100%)',
} as const;

const SIZE = {
  large: {
    borderRadius: 4,
    padding: '28px 24px 24px',
    circle1: { top: -48, right: -48, width: 180, height: 180 },
    circle2: { bottom: -28, right: 80, width: 96, height: 96 },
  },
  small: {
    borderRadius: 2.5,
    padding: '14px 14px 12px',
    circle1: { top: -24, right: -24, width: 80, height: 80 },
    circle2: { bottom: -14, right: 30, width: 48, height: 48 },
  },
} as const;

export type GradientCardVariant = keyof typeof GRADIENTS;
export type GradientCardSize = keyof typeof SIZE;

type Props = {
  variant?: GradientCardVariant;
  size?: GradientCardSize;
  children: ReactNode;
  sx?: BoxProps['sx'];
  className?: string;
  'data-tour'?: string;
};

export const GradientCard = ({
  variant = 'blue',
  size = 'large',
  children,
  sx,
  className,
  'data-tour': dataTour,
}: Props) => {
  const { borderRadius, padding, circle1, circle2 } = SIZE[size];
  return (
    <Box
      className={className}
      data-tour={dataTour}
      sx={{
        background: GRADIENTS[variant],
        borderRadius,
        padding,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        ...sx,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
          ...circle1,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
          ...circle2,
        }}
      />
      {children}
    </Box>
  );
};
