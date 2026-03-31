'use client';

import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { useGoBack } from '@supreme-int/nextjs-shared/src/shared/hooks/useGoBack';
import { usePathname, useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof NavBar>, 'onBack'>;

export const DefaultNavbar = (props: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const goBack = useGoBack();

  const onBack = () => {
    if (typeof window !== 'undefined') {
      goBack();
      return;
    }
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return;
    router.replace(`/${pathParts.slice(0, -1).join('/')}`);
  };

  return <NavBar onBack={onBack} {...props} />;
};
