import { i18n } from '@supreme-int/i18n/src/i18n';
import { SubjectsRankingPage } from 'services/web-profile-ssr/src/views/SubjectsRankingPage/SubjectsRankingPage';

const getInitialData = async () => {
  return {
    subjects: [
      [
        { id: '1-1', name: i18n('Математический анализ'), priority: 1, teacher: i18n('Иванова Г. Ю.') },
        { id: '1-2', name: i18n('Линейная алгебра и геометрия'), priority: 2, teacher: i18n('Смирнов М. В.') },
        { id: '1-3', name: i18n('Дискретная математика'), priority: 3, teacher: i18n('Павлов С. Н.') },
        { id: '1-4', name: i18n('Теория вероятностей и статистика'), priority: 4, teacher: i18n('Морозова Е. А.') },
      ],
      [
        { id: '2-1', name: i18n('Физика (механика)'), priority: 1, teacher: i18n('Белов О. И.') },
        { id: '2-2', name: i18n('Физика (электричество и магнетизм)'), priority: 2, teacher: i18n('Кузнецова Т. С.') },
      ],
      [
        { id: '3-1', name: i18n('Программирование на Python'), priority: 1, teacher: i18n('Петренко Д. А.') },
        {
          id: '3-2',
          name: i18n('Введение в алгоритмы и структуры данных'),
          priority: 2,
          teacher: i18n('Романова А. В.'),
        },
        { id: '3-3', name: i18n('Основы веб‑разработки'), priority: 3, teacher: i18n('Попов И. М.') },
      ],
    ].slice(0, Math.floor(Math.random() * 4)),
    deadlineDate: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}.2026`,
  };
};

const RankingPage = async () => {
  const initialData = await getInitialData();
  return <SubjectsRankingPage {...initialData} />;
};

export default RankingPage;
