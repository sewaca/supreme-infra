import { redirect } from 'next/navigation';
import { getAuthInfo } from '../../../../src/shared/api/getUserId';
import { NewBroadcastView } from '../../../../src/views/NewBroadcastView/NewBroadcastView';

export const dynamic = 'force-dynamic';

export default async function NewBroadcastPage() {
  const auth = await getAuthInfo();
  if (auth.role !== 'teacher') redirect('/messages');

  return <NewBroadcastView />;
}
