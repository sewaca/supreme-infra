import { getAuthInfo } from '../../../src/shared/api/getUserId';
import { NewMessageView } from '../../../src/views/NewMessageView/NewMessageView';

export const dynamic = 'force-dynamic';

export default async function NewPage() {
  const auth = await getAuthInfo();
  return <NewMessageView currentUserId={auth.userId ?? ''} />;
}
