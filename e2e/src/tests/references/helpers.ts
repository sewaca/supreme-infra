import type { Page } from '@playwright/test';

export const REFERENCES_URL = '/profile/references';

export async function fillType(page: Page, text: string) {
  await page.getByTestId('reference-type-input').fill(text);
}

export async function fillTypeAndSelect(page: Page, text: string) {
  await fillType(page, text);
  const option = page.locator('[role="listbox"] [role="option"]').filter({ hasText: text });
  if ((await option.count()) > 0) {
    await option.first().click();
  } else {
    await page.getByTestId('reference-type-input').press('Tab');
  }
}

export async function togglePdf(page: Page) {
  await page.getByTestId('reference-virtual-checkbox').click();
}

export function submitBtn(page: Page) {
  return page.getByTestId('reference-submit-btn');
}

export function pickupFormControl(page: Page) {
  return page.getByTestId('reference-pickup-form-control');
}

// Кликабельный combobox (видимая часть MUI Select), а не скрытый input
export function pickupCombobox(page: Page) {
  return page.getByRole('combobox', { name: 'Где получить справку' });
}
