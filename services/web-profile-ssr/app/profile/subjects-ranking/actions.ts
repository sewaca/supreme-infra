'use server';

import { savePrioritiesSubjectsSavePrioritiesPost } from '@supreme-int/api-client/src/generated/core-client-info';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getAuthInfo } from 'services/web-profile-ssr/src/shared/api/getUserId';

type Choice = { id: string; priorities: string[] };

export const saveChoices = async (choices: Choice[]): Promise<boolean> => {
  'use server';

  const { userId } = await getAuthInfo();

  await Promise.all(
    choices.map((choice) =>
      savePrioritiesSubjectsSavePrioritiesPost({
        client: coreClientInfoClient,
        query: { user_id: userId },
        body: {
          choice_id: choice.id,
          priorities: choice.priorities,
        },
      }),
    ),
  );

  return true;
};
