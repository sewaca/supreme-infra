import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';

type SubjectInfo = { id: string; name: string; teacher: string };

export type ChoiceGroup = {
  id: string;
  subjects: SubjectInfo[];
  deadlineDate: string;
};

export const getAvailableChoices = async (): Promise<ChoiceGroup[]> => {
  const res = await CoreClientInfo.getChoicesSubjectsChoicesGet({
    client: coreClientInfoClient,
  });

  const choices = res.data ?? [];

  return choices
    .filter((c) => c.is_active)
    .map((c) => {
      const d = new Date(c.deadline_date);
      return {
        id: c.choice_id,
        subjects: c.subjects ?? [],
        deadlineDate: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`,
      };
    });
};
