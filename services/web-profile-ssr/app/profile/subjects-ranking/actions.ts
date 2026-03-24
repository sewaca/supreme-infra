'use server';

import { CoreClientInfo } from '@supreme-int/api-client/src/index';
import { coreClientInfoClient } from 'services/web-profile-ssr/src/shared/api/clients';
import { getUserId } from 'services/web-profile-ssr/src/shared/api/getUserId';

type Choice = { id: string; priorities: string[] };

export const saveChoices = async (choices: Choice[]): Promise<boolean> => {
  'use server';

  const userId = getUserId();

  await Promise.all(
    choices.map((choice) =>
      CoreClientInfo.savePrioritiesSubjectsSavePrioritiesPost({
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
