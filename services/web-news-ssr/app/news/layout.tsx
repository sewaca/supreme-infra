import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfo } from '../../src/shared/api/getAuthInfo';
import { NewsLayout } from '../../src/views/NewsLayout/NewsLayout';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthInfo();

  let avatar: string | null = null;
  let userName = auth.name ?? '';

  if (auth.userId) {
    const profileRes = await getUserProfileUserGet({
      client: coreClientInfoClient,
      query: { user_id: auth.userId },
    });
    if (profileRes.data) {
      avatar = profileRes.data.avatar ?? null;
      userName = profileRes.data.name ?? userName;
    }
  }

  return (
    <NewsLayout avatar={avatar} userName={userName}>
      {children}
    </NewsLayout>
  );
}
