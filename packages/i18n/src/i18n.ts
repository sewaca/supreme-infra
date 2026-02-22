import { dictionary, type Language } from './dictionary';

/**
 * mocked version of i18n with 1 language
 */
export const i18n = (key: string, params?: Record<string, string>) => {
  const language: Language = 'ru';

  if (params) {
    return key.replace(/{{(.*?)}}/g, (match, p1) => params?.[p1] || match);
  }

  if (dictionary?.[language]?.[key]) {
    return dictionary[language][key];
  }

  return key;
};
