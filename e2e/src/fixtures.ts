import { test as base, expect, type Page } from '@playwright/test';

export { expect };

import { AUTH_COOKIE_NAME, AUTH_TOKEN, BASE_PATH } from './contants';

interface AuthFixtures {
  authenticatedPage: Page;
}

// Ключи всех product-tour'ов, которые не должны запускаться в тестах
const TOUR_COMPLETED_KEYS = [
  'references-tour-completed',
  'orders-tour-completed',
  'rating-tour-completed',
  'subjects-ranking-tour-completed',
  'scholarship-tour-completed',
  'dormitory-tour-completed',
];

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }, use) => {
    await context.addCookies([
      {
        name: AUTH_COOKIE_NAME,
        value: AUTH_TOKEN,
        url: BASE_PATH,
      },
    ]);

    // Выставляем флаги завершённости туров до загрузки страницы,
    // чтобы product-tour не перекрывал элементы во время тестов
    await page.addInitScript((keys: string[]) => {
      for (const key of keys) {
        localStorage.setItem(key, 'true');
      }
    }, TOUR_COMPLETED_KEYS);

    await use(page);
  },
});
