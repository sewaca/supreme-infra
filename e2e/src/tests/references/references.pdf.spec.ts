import { expect, test } from '../../fixtures';
import { pickupFormControl, REFERENCES_URL, togglePdf } from './helpers';

test.describe('3. PDF-переключатель', () => {
  test('3.1 — включение PDF скрывает поле выдачи', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await expect(pickupFormControl(page)).not.toBeVisible();
  });

  test('3.2 — PDF выключен по умолчанию; поле выдачи видно', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId('reference-virtual-checkbox')).not.toBeChecked();
    await expect(pickupFormControl(page)).toBeVisible();
  });

  test('3.3 — переключение false→true скрывает поле выдачи', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId('reference-virtual-checkbox')).not.toBeChecked();
    await togglePdf(page);
    await expect(pickupFormControl(page)).not.toBeVisible();
  });

  test('3.4 — переключение true→false возвращает поле выдачи', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);

    await togglePdf(page); // false → true: поле скрывается
    await expect(pickupFormControl(page)).not.toBeVisible();

    await togglePdf(page); // true → false: поле возвращается
    await expect(pickupFormControl(page)).toBeVisible();
  });
});
