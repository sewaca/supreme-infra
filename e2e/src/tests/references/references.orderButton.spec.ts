import { expect, test } from '../../fixtures';
import { fillType, fillTypeAndSelect, REFERENCES_URL, submitBtn, togglePdf } from './helpers';

test.describe('4. Кнопка «Заказать»', () => {
  test('4.1 — disabled: тип не выбран, PDF выключен', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('4.2 — active: пользовательский тип активирует кнопку через defaultPickupPointIds', async ({
    authenticatedPage: page,
  }) => {
    // Компонент всегда делает auto-select через defaultPickupPointIds,
    // поэтому для любого непустого типа (даже не из справочника) кнопка становится активной.
    await page.goto(REFERENCES_URL);
    await fillType(page, 'Произвольный тип');
    await page.getByTestId('reference-type-input').press('Tab');
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test('4.3 — active: тип выбран из справочника, пункт выдачи автовыбран, PDF выключен', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, 'РЖД');
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test('4.4 — active: тип выбран, PDF включён (пункт выдачи не нужен)', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, 'РЖД');
    await togglePdf(page);
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test('4.5 — disabled: тип пустой, PDF включён', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('4.6 — disabled: тип из только пробелов, PDF включён', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await fillType(page, '   ');
    await page.getByTestId('reference-type-input').press('Tab');
    await expect(submitBtn(page)).toBeDisabled();
  });
});
