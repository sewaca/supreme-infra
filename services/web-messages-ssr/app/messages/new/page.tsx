import { getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfo';
import { NewMessageView } from '../../../src/views/NewMessageView/NewMessageView';

export const dynamic = 'force-dynamic';

export default async function NewPage() {
  const auth = await getAuthInfo();
  return <NewMessageView currentUserId={auth.userId ?? ''} />;
}
