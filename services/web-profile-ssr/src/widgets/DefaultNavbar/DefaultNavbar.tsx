'use client';

import { NavBar } from '@supreme-int/design-system/src/components/NavBar/NavBar';
import { useGoBack } from '@supreme-int/nextjs-shared/src/shared/hooks/useGoBack';
import { usePathname, useRouter } from 'next/navigation';
import { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof NavBar>, 'onBack'>;

export const DefaultNavbar = (props: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = useGoBack();

  const onBack = () => {
    // Проверяем, можно ли вернуться назад в истории браузера
    if (typeof window !== 'undefined' && window) {
      goBack();
      return;
    }

    // Fallback: если вернуться некуда, переходим на родительский путь
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return;

    // Убираем последнюю часть пути
    const parentPath = `/${pathParts.slice(0, -1).join('/')}`;
    router.replace(parentPath);
  };

  return <NavBar onBack={onBack} {...props} />;
};
