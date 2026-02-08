'use server';

export const submitParentAgreement = async ({
  applicationId,
  file,
}: {
  applicationId: string;
  file: File;
}): Promise<{ success: boolean; error?: string }> => {
  'use server';

  console.debug(
    `[submit-parent-agreement] submitting parent agreement for applicationId="${applicationId}", file="${file.name}"`,
  );

  return { success: true };
};
