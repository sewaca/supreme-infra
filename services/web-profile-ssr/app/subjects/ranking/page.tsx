import { i18n } from '@supreme-int/i18n/src/i18n';
import { SubjectsRankingPage } from 'services/web-profile-ssr/src/views/SubjectsRankingPage/SubjectsRankingPage';
import { getAvailableChoices } from './api/getAvailableChoices';
import { getUserPriorities } from './api/getUserPriorities';

type GroupId = 'math' | 'physics' | 'programming';
type SubjectInfo = { id: string; name: string; teacher: string };
type PrioritizedSubjectInfo = SubjectInfo & { priority: number };

const getInitialData = async () => {
  const [choices, userPriorities] = await Promise.all([getAvailableChoices(), getUserPriorities()]);

  // TODO: вынести сортировку на клиент
  choices.forEach((choice) => {
    const priorities = userPriorities[choice.id];
    if (!priorities) return;

    choice.subjects.sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id));
  });

  const result: { subjects: { id: GroupId; subjects: PrioritizedSubjectInfo[] }[]; deadlineDate: string } = {
    subjects: choices.map((choice) => ({
      id: choice.id,
      subjects: choice.subjects.map((subject, i) => {
        const priorities = userPriorities[choice.id];

        return {
          id: subject.id,
          name: i18n(subject.name),
          teacher: i18n(subject.teacher),
          priority: (priorities?.indexOf(subject.id) ?? i) + 1,
        };
      }),
    })),
    deadlineDate: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}.2026`,
  };

  return result;
};

const RankingPage = async () => {
  const initialData = await getInitialData();
  return <SubjectsRankingPage {...initialData} />;
};

export default RankingPage;
