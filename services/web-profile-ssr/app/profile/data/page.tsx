import { ProfileDataPage } from 'services/web-profile-ssr/src/views/ProfileDataPage/ProfileDataPage';

const getUserData = async () => {
  return {
    name: 'Всеволод',
    lastName: 'Булгаков',
    middleName: 'Денисович',
    avatar: 'https://placehold.co/600x1000',
  };
};

const getProfileData = async () => {
  return [
    { label: 'Дата рождения', value: '20.11.2004' },
    { label: 'СНИЛС', value: '157-512-856 80' },
    { label: 'Дата выдачи СНИЛС', value: '14.02.2010' },
    { label: 'Регион', value: 'Свердловская' },
    { label: 'Учебное заведение', value: 'Университет телекоммуникаций' },
    { label: 'Факультет', value: 'Информационных технологий и программной инженерии (ИТПИ)' },
    { label: 'Специальность/направление', value: '09.03.04 - Программная инженерия' },
    { label: 'Форма обучения', value: 'Очная' },
    { label: 'Квалификация', value: 'Бакалавр' },
    {
      label: 'Профиль',
      value: 'Разработка программного обеспечения и приложений искусственного интеллекта в киберфизических системах',
    },
    { label: 'Группа', value: 'ИКПИ-25' },
    { label: 'Статус', value: 'Обучается (Бюджет)' },
    { label: 'Курс', value: '4' },
    { label: 'Год начала обучения', value: '2022' },
    { label: 'Год окончания обучения', value: '2026' },
    { label: 'Студенческий билет', value: '№ 2205051' },
  ];
};

export default async () => {
  const userInfo = await getUserData();
  const data = await getProfileData();

  return <ProfileDataPage {...userInfo} data={data} />;
};
