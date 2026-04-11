import { getChoicesSubjectsChoicesGet } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';

type SubjectInfo = { id: string; name: string; teacher: string };

type ChoiceGroup = {
  id: string;
  subjects: SubjectInfo[];
  deadlineDate: string;
};

export const getAvailableChoices = async (): Promise<ChoiceGroup[]> => {
  const res = await getChoicesSubjectsChoicesGet({
    client: coreClientInfoClient,
  });

  const choices = res.data ?? [];

  const now = new Date();
  return choices
    .filter((c) => c.is_active && new Date(c.deadline_date) > now)
    .map((c) => {
      const d = new Date(c.deadline_date);
      return {
        id: c.choice_id,
        subjects: c.subjects ?? [],
        deadlineDate: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`,
      };
    });
};
