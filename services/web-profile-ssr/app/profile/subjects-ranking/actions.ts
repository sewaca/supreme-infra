'use server';

import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

type Choice = { id: string; priorities: string[] };

export const saveChoices = async (choices: Choice[]): Promise<boolean> => {
  'use server';

  const userId = getUserId();

  // Get active choices to find the correct choice_id for the API
  const choicesRes = await CoreClientInfo.getChoicesSubjectsChoicesGet({
    client: coreClientInfoClient,
  });

  const activeChoices = (choicesRes.data ?? []).filter((c) => c.is_active);

  // Save priorities for each choice group
  // Use the first active choice's ID as the choice_id
  const choiceId = activeChoices[0]?.id;
  if (!choiceId) {
    throw new Error('No active subject choice period found');
  }

  // Flatten all priorities from all groups and save
  for (const choice of choices) {
    await CoreClientInfo.savePrioritiesSubjectsSavePrioritiesPost({
      client: coreClientInfoClient,
      query: { user_id: userId },
      body: {
        choice_id: choiceId,
        priorities: choice.priorities,
      },
    });
  }

  return true;
};
