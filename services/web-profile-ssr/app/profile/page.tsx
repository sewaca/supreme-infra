import { ProfileData } from 'services/web-profile-ssr/src/entities/Profile/ProfileData';
import { ProfilePage } from 'services/web-profile-ssr/src/views/ProfilePage/ProfilePage';

const getUserData = async () => {
  const baseUserInfo: ProfileData = {
    name: 'Всеволод',
    lastName: 'Булгаков',
    middleName: 'Денисович',
    avatar: 'https://placehold.co/600x1000',
  };

  const hasScholarship = Math.random() > 0.5;
  const hasDormitory = Math.random() > 0.5;

  if (hasScholarship) {
    const hasNotifications = Math.random() > 0.5;
    baseUserInfo.scholarship = {
      value: '100 000',
      notifications: hasNotifications ? Math.floor(Math.random() * 100) : undefined,
    };
  }

  if (hasDormitory) {
    const hasNotifications = Math.random() > 0.5;
    baseUserInfo.dormitory = {
      value: 'ул. Караваевская, 34',
      notifications: hasNotifications ? Math.floor(Math.random() * 100) : undefined,
    };
  }

  return baseUserInfo;
};

export default async () => {
  const userInfo = await getUserData();

  return <ProfilePage data={userInfo} />;
};
