import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfo } from 'services/web-profile-ssr/src/shared/api/getUserId';

type SubjectInfo = { id: string; name: string; teacher: string };

export type ChoiceWithPriorities = {
  id: string;
  choice_id: string;
  deadline_date: string;
  is_active: boolean;
  subjects: SubjectInfo[];
  user_priorities: string[];
};

export const getChoicesWithPriorities = async (): Promise<ChoiceWithPriorities[]> => {
  const { userId } = await getAuthInfo();
  const now = new Date();

  const res = await coreClientInfoClient.get({
    url: '/subjects/choices-with-priorities',
    query: { user_id: userId },
  });

  const data = (res.data ?? []) as ChoiceWithPriorities[];

  return data.filter((c) => c.is_active && new Date(c.deadline_date) > now);
};
