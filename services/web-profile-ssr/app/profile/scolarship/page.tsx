import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async () => {
  redirect('/profile/scholarship');
};
