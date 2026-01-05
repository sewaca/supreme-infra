import { redirect } from 'next/navigation';
import { serverApi } from '../../../src/shared/api/backendApi';
import type { User } from '../../../src/shared/api/backendApi.types';
import { getAuthToken, getUser } from '../../../src/shared/lib/auth.server';
import { ProfilePage } from '../../../src/views/ProfilePage/ProfilePage';

interface ProfileByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileByIdPage({ params }: ProfileByIdPageProps) {
  const currentUser = await getUser();

  if (!currentUser) {
    redirect('/login');
  }

  const { id } = await params;
  const userId = Number.parseInt(id, 10);

  if (Number.isNaN(userId)) {
    redirect('/profile');
  }

  const token = await getAuthToken();
  if (!token) {
    redirect('/login');
  }

  let user: User;
  try {
    user = await serverApi.getUserById(userId, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/login');
    }
    if (error instanceof Error && error.message === 'User not found') {
      redirect('/profile');
    }
    throw error;
  }

  return <ProfilePage user={user} isViewingOtherUser={true} />;
}
