/**
 * mocked version of i18n with 1 language
 */
export const i18n = (key: string, params?: Record<string, string>) => {
  if (params) {
    return key.replace(/{{(.*?)}}/g, (match, p1) => params?.[p1] || match);
  }
  return key;
};
