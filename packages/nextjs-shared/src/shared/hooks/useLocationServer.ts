// TODO: killme
// import { useRouter } from 'next/router';
// import { useMemo } from 'react';

// export function useLocationServer(): string {
//   const router = useRouter();

//   return useMemo(() => {
//     const formattedQuery: Record<string, string> = Object.fromEntries(
//       Object.entries(router.query).map(([key, value]) =>
//         !value ? [] : [key, typeof value === 'string' ? value : value.join(',')],
//       ),
//     );
//     const search = new URLSearchParams(formattedQuery).toString();
//     return search ? `${router.pathname}?${search}` : router.pathname;
//   }, [router]);
// }
