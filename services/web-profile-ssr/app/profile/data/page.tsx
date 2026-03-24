import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { ProfileDataPage } from 'services/web-profile-ssr/src/views/ProfileDataPage/ProfileDataPage';

export const dynamic = 'force-dynamic';

export default async () => {
  const userId = getUserId();

  const res = await CoreClientInfo.getPersonalDataProfilePersonalDataGet({
    client: coreClientInfoClient,
    query: { user_id: userId },
  });

  const personalData = res.data;
  const user = personalData?.user;

  if (!user) {
    throw 'no personal data found.';
  }

  return (
    <ProfileDataPage
      avatar={user.avatar ?? 'https://placehold.co/600x1000'}
      lastName={user.last_name}
      name={user.name}
      middleName={user.middle_name ?? undefined}
      data={personalData.academic_info}
    />
  );
};
