import { expect, test } from '../../fixtures';
import { fillTypeAndSelect, pickupCombobox, pickupFormControl, REFERENCES_URL, submitBtn, togglePdf } from './helpers';

test.describe('2. Где получить справку', () => {
  test('2.1 — пункт «СПбГУТ» выбирается после указания типа', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, 'По месту работы родителей');
    // Кликаем на видимый combobox, а не на скрытый input
    await pickupCombobox(page).click();
    const option = page.locator('[role="option"]').filter({ hasText: 'СПбГУТ' });
    await expect(option).toBeVisible();
    await option.click();
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test('2.2 — пункт «СПбКТ» выбирается после указания типа', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, 'По месту работы родителей');
    await pickupCombobox(page).click();
    const option = page.locator('[role="option"]').filter({ hasText: 'СПбКТ' });
    await expect(option).toBeVisible();
    await option.click();
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test('2.3 — поле выдачи недоступно до выбора типа', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    // MUI FormControl не ставит aria-disabled на wrapper; проверяем child combobox
    await expect(pickupCombobox(page)).toBeDisabled();
  });

  test('2.4 — кнопка disabled без пункта выдачи при выключенном PDF', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);

    await expect(submitBtn(page)).toBeDisabled();
  });

  test('2.5 — после выбора типа автоматически выбирается первый пункт выдачи', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, 'РЖД');
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test('2.6 — поле выдачи скрыто при включённом PDF', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await expect(pickupFormControl(page)).not.toBeVisible();
  });
});
