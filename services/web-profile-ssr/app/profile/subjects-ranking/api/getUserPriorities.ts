import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';
import { getAvailableChoices } from './getAvailableChoices';

type GroupId = 'math' | 'physics' | 'programming';

export const getUserPriorities = async () => {
  const userId = getUserId();

  // Get active subject choices from API
  const choicesRes = await CoreClientInfo.getChoicesSubjectsChoicesGet({
    client: coreClientInfoClient,
  });

  const choices = choicesRes.data ?? [];
  const activeChoices = choices.filter((c) => c.is_active);

  if (activeChoices.length === 0) {
    return {} as Partial<Record<GroupId, string[]>>;
  }

  // Get user priorities for each active choice
  // API expects semantic choice_id (e.g. "math_electives_2026"), not UUID
  const prioritiesPromises = activeChoices.map((choice) =>
    CoreClientInfo.getUserPrioritiesSubjectsUserPrioritiesChoiceIdGet({
      client: coreClientInfoClient,
      path: { choice_id: choice.choice_id },
      query: { user_id: userId },
    }),
  );

  const prioritiesResults = await Promise.all(prioritiesPromises);

  // Build a map of subject_id → group_id from the static catalog
  const catalog = await getAvailableChoices();
  const subjectToGroup = new Map<string, GroupId>();
  for (const group of catalog) {
    for (const subject of group.subjects) {
      subjectToGroup.set(subject.id, group.id);
    }
  }

  // Group priorities by frontend group ID
  const result: Partial<Record<GroupId, string[]>> = {};
  for (const prioritiesRes of prioritiesResults) {
    const priorities = prioritiesRes.data ?? [];
    // Sort by priority index
    const sorted = [...priorities].sort((a, b) => a.priority - b.priority);
    for (const p of sorted) {
      const groupId = subjectToGroup.get(p.subject_id);
      if (groupId) {
        if (!result[groupId]) {
          result[groupId] = [];
        }
        result[groupId].push(p.subject_id);
      }
    }
  }

  return result;
};
