'use server';

import { savePrioritiesSubjectsSavePrioritiesPost } from '@supreme-int/api-client/src/generated/core-client-info';
import { client as coreClientInfoClient } from '@supreme-int/api-client/src/generated/core-client-info/client.gen';
import { getAuthInfoOrUnauthorized as getAuthInfo } from '@supreme-int/nextjs-shared/src/shared/auth/getAuthInfoOrUnauthorized';

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
