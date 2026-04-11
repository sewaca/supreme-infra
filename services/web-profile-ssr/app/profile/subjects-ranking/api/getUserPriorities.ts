import {
  getChoicesSubjectsChoicesGet,
  getUserPrioritiesSubjectsUserPrioritiesChoiceIdGet,
} from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfo } from 'services/web-profile-ssr/src/shared/api/getUserId';

export const getUserPriorities = async (): Promise<Record<string, string[]>> => {
  const { userId } = await getAuthInfo();

  const choicesRes = await getChoicesSubjectsChoicesGet({
    client: coreClientInfoClient,
  });

  const activeChoices = (choicesRes.data ?? []).filter((c) => c.is_active);

  if (activeChoices.length === 0) return {};

  // API expects semantic choice_id (e.g. "math", "physics", "programming")
  const prioritiesResults = await Promise.all(
    activeChoices.map((choice) =>
      getUserPrioritiesSubjectsUserPrioritiesChoiceIdGet({
        client: coreClientInfoClient,
        path: { choice_id: choice.choice_id },
        query: { user_id: userId },
      }),
    ),
  );

  const result: Record<string, string[]> = {};
  for (let i = 0; i < activeChoices.length; i++) {
    const groupId = activeChoices[i].choice_id;
    const priorities = prioritiesResults[i].data ?? [];
    const sorted = [...priorities].sort((a, b) => a.priority - b.priority);
    result[groupId] = sorted.map((p) => p.subject_id);
  }

  return result;
};
