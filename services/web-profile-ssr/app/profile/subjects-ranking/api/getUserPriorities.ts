import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

export const getUserPriorities = async (): Promise<Record<string, string[]>> => {
  const userId = getUserId();

  const choicesRes = await CoreClientInfo.getChoicesSubjectsChoicesGet({
    client: coreClientInfoClient,
  });

  const activeChoices = (choicesRes.data ?? []).filter((c) => c.is_active);

  if (activeChoices.length === 0) return {};

  // API expects semantic choice_id (e.g. "math", "physics", "programming")
  const prioritiesResults = await Promise.all(
    activeChoices.map((choice) =>
      CoreClientInfo.getUserPrioritiesSubjectsUserPrioritiesChoiceIdGet({
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
