'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useLocation(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    const search = searchParams.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);
}
