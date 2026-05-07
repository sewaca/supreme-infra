import { getApplicationsApplicationsGet } from '@supreme-int/api-client/src/generated/core-applications';
import { client as coreApplicationsClient } from '@supreme-int/api-client/src/generated/core-applications/client.gen';
import { getUserProfileUserGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfoOrUnauthorized as getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfoOrUnauthorized';
import type { ProfileData } from 'services/web-profile-ssr/src/entities/Profile/ProfileData';
import { ProfilePage } from 'services/web-profile-ssr/src/views/ProfilePage/ProfilePage';

export const dynamic = 'force-dynamic';

export default async () => {
  const { userId } = await getAuthInfo();

  const [userRes, applicationsRes] = await Promise.all([
    getUserProfileUserGet({
      client: coreClientInfoClient,
      query: { user_id: userId },
    }),
    getApplicationsApplicationsGet({
      client: coreApplicationsClient,
      query: { user_id: userId },
    }),
  ]);

  const user = userRes.data;
  const applications = applicationsRes.data ?? [];

  if (!user) {
    throw 'no user found';
  }

  const scholarshipApp = applications.find((a) => a.application_type === 'scholarship' && a.is_active);
  const dormitoryApp = applications.find((a) => a.application_type === 'dormitory' && a.is_active);

  const profileData: ProfileData = {
    name: user.name,
    lastName: user.last_name,
    middleName: user.middle_name ?? undefined,
    avatar: user.avatar ?? null,
    scholarship: scholarshipApp
      ? {
          value: scholarshipApp.additional_fields?.amount
            ? String(scholarshipApp.additional_fields.amount)
            : scholarshipApp.application_number,
          notifications: scholarshipApp.notifications_count || undefined,
        }
      : undefined,
    dormitory: dormitoryApp
      ? {
          value: (dormitoryApp.additional_fields?.dormitoryName as string) ?? dormitoryApp.application_number,
          notifications: dormitoryApp.notifications_count || undefined,
        }
      : undefined,
  };

  return <ProfilePage data={profileData} />;
};
