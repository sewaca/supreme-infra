'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useGoBack() {
  const router = useRouter();
  // const pathname = usePathname();
  // const searchParams = useSearchParams();

  const goBack = useCallback(() => {
    if (typeof window === 'undefined' || !window) return;

    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    const retpath = searchParams.get('retpath');

    if (retpath) {
      router.push(retpath);
      return;
    }

    const pathParts = pathname.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      router.push('/');
      return;
    }

    pathParts.pop();

    const previousPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';

    router.push(previousPath);
  }, [router]);

  return goBack;
}
