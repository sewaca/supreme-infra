'use client';

import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { useRouter } from 'next/navigation';
import { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof NavBar>, 'onBack'>;

export const DefaultNavbar = (props: Props) => {
  const router = useRouter();

  const onBack = () => {
    router.back();
  };

  return <NavBar onBack={onBack} {...props} />;
};
