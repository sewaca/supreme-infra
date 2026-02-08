import { DormitoryPage } from 'services/web-profile-ssr/src/views/DormitoryPage/DormitoryPage';

const getDormitoryData = async () => {
  return {
    address: 'ул. Караваевская, 34',
    name: 'Рыбацкое',
    roomNumber: '51б/2',
    contract: {
      number: '10601 ЖК23219',
      id: 'b6e6fcb9-6a5f-46b0-9060-601bc48f8954',
      startDate: '01.01.2026',
      endDate: '01.01.2027',
    },
    notifications: [
      { severity: 'warning' as const, message: 'Необходимо оплатить задолженность 2 000 ₽', action: '/contracts' },
      {
        severity: 'error' as const,
        message: 'Нужно загрузить согласие от родителей',
        action: 'deeplink://dormitory/parent_agreement/upload_file?applicationId=b6e6fcb9-6a5f-46b0-9060-601bc48f8954',
      },
      { severity: 'success' as const, message: 'Можно заселяться с 01.01.2026' },
    ],
  };
};

export default async () => {
  const data = await getDormitoryData();
  // TODO: добавить логику для тех кто еще не живёт в общежитии
  return <DormitoryPage {...data} />;
};
