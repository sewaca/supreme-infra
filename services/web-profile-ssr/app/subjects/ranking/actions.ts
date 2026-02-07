'use server';

export const saveChoices = async (choices: { [key: string]: string | number }[][]): Promise<boolean> => {
  'use server';
  console.log(`[debug] saved choices are: ${JSON.stringify(choices)}`);

  await new Promise((resolve) => setTimeout(resolve, 500));

  const isError = Math.random() > 0.7;
  if (isError) {
    // return status 500
    console.log('[debug] random error occurred');
    throw new Error('Failed to save choices');
  }

  const result = Math.random() > 0.5;

  console.log(`[debug] status: "200", result: ${result}`);
  return result;
};
