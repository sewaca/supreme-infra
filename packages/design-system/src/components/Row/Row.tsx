import { Stack } from '@mui/material';
import { ComponentProps, ReactNode } from 'react';

type Props = ComponentProps<typeof Stack> & {
  children?: ReactNode;
  gap?: ComponentProps<typeof Stack>['gap'];
  alignItems?: ComponentProps<typeof Stack>['alignItems'];
};
export const Row = ({ children, gap = 1, alignItems = 'center', ...props }: Props) => {
  return (
    <Stack direction="row" gap={gap} alignItems={alignItems} {...props}>
      {children}
    </Stack>
  );
};
