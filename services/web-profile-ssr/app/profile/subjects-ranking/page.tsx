import { i18n } from '@supreme-int/i18n/src/i18n';
import { SubjectsRankingPage } from 'services/web-profile-ssr/src/views/SubjectsRankingPage/SubjectsRankingPage';
import { getAvailableChoices } from './api/getAvailableChoices';
import { getUserPriorities } from './api/getUserPriorities';

export const dynamic = 'force-dynamic';

type PrioritizedSubjectInfo = { id: string; name: string; teacher: string; priority: number };

const getInitialData = async () => {
  const [choices, userPriorities] = await Promise.all([getAvailableChoices(), getUserPriorities()]);

  // Sort subjects by user priorities
  choices.forEach((choice) => {
    const priorities = userPriorities[choice.id];
    if (!priorities) return;
    choice.subjects.sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id));
  });

  const deadlineDate = choices[0]?.deadlineDate ?? '01.04.2026';

  return {
    subjects: choices.map((choice) => ({
      id: choice.id,
      subjects: choice.subjects.map((subject, i) => {
        const priorities = userPriorities[choice.id];
        return {
          id: subject.id,
          name: i18n(subject.name),
          teacher: i18n(subject.teacher),
          priority: (priorities?.indexOf(subject.id) ?? i) + 1,
        } satisfies PrioritizedSubjectInfo;
      }),
    })),
    deadlineDate,
  };
};

const RankingPage = async () => {
  const initialData = await getInitialData();
  return <SubjectsRankingPage {...initialData} />;
};

export default RankingPage;
