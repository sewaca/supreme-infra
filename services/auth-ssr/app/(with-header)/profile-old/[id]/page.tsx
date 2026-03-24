import { redirect } from 'next/navigation';
import { getUser } from '../../../../src/shared/lib/auth.server';
import { ProfilePage } from '../../../../src/views/ProfilePage/ProfilePage';

export const dynamic = 'force-dynamic';

interface ProfileByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileByIdPage({ params }: ProfileByIdPageProps) {
  const currentUser = await getUser();

  if (!currentUser) {
    redirect('/login');
  }

  const { id } = await params;

  // TODO: getUserById is not supported by core-auth yet.
  // If the requested ID matches the current user, show their profile.
  // Otherwise redirect to own profile.
  if (id !== currentUser.id) {
    redirect('/profile-old');
  }

  return <ProfilePage user={currentUser} isViewingOtherUser={false} />;
}
