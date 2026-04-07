import { i18n } from '@supreme-int/i18n/src/i18n';
import { SubjectsRankingPage } from 'services/web-profile-ssr/src/views/SubjectsRankingPage/SubjectsRankingPage';
import { getChoicesWithPriorities } from './api/getChoicesWithPriorities';

export const dynamic = 'force-dynamic';

type PrioritizedSubjectInfo = { id: string; name: string; teacher: string; priority: number };

const getInitialData = async () => {
  const choices = await getChoicesWithPriorities();

  const deadlineDate = choices[0]?.deadline_date
    ? (() => {
        const d = new Date(choices[0].deadline_date);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
      })()
    : '01.04.2026';

  return {
    subjects: choices.map((choice) => {
      const priorities = choice.user_priorities;
      const sorted = [...choice.subjects].sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id));
      return {
        id: choice.choice_id,
        subjects: sorted.map((subject, i) => ({
          id: subject.id,
          name: i18n(subject.name),
          teacher: i18n(subject.teacher),
          priority: (priorities.indexOf(subject.id) !== -1 ? priorities.indexOf(subject.id) : i) + 1,
        })) satisfies PrioritizedSubjectInfo[],
      };
    }),
    deadlineDate,
  };
};

const RankingPage = async () => {
  const initialData = await getInitialData();
  return <SubjectsRankingPage {...initialData} />;
};

export default RankingPage;
