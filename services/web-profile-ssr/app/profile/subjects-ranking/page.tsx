import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { i18n } from '@supreme-int/i18n/src/i18n';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { SubjectsRankingPage } from 'services/web-profile-ssr/src/views/SubjectsRankingPage/SubjectsRankingPage';
import { getAvailableChoices } from './api/getAvailableChoices';
import { getUserPriorities } from './api/getUserPriorities';

export const dynamic = 'force-dynamic';

type GroupId = 'math' | 'physics' | 'programming';
type PrioritizedSubjectInfo = { id: string; name: string; teacher: string; priority: number };

const getInitialData = async () => {
  const [choices, userPriorities, choicesRes] = await Promise.all([
    getAvailableChoices(),
    getUserPriorities(),
    CoreClientInfo.getChoicesSubjectsChoicesGet({ client: coreClientInfoClient }),
  ]);

  const activeChoice = (choicesRes.data ?? []).find((c) => c.is_active);

  // Sort subjects by user priorities
  choices.forEach((choice) => {
    const priorities = userPriorities[choice.id];
    if (!priorities) return;

    choice.subjects.sort((a, b) => priorities.indexOf(a.id) - priorities.indexOf(b.id));
  });

  // Format deadline from API or fallback
  let deadlineDate: string;
  if (activeChoice) {
    const d = new Date(activeChoice.deadline_date);
    deadlineDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  } else {
    deadlineDate = '01.04.2026';
  }

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
    deadlineDate,
  };

  return result;
};

const RankingPage = async () => {
  const initialData = await getInitialData();
  return <SubjectsRankingPage {...initialData} />;
};

export default RankingPage;
