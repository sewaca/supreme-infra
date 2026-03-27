import { redirect } from 'next/navigation';
import { getUser } from '../../src/shared/lib/auth.server';
import { ProfilePage } from '../../src/views/ProfilePage/ProfilePage';

export const dynamic = 'force-dynamic';

export default async function Profile() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <ProfilePage user={user} />;
}
