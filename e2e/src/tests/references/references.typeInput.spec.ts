import { expect, test } from '../../fixtures';
import { fillType, fillTypeAndSelect, pickupFormControl, REFERENCES_URL, submitBtn, togglePdf } from './helpers';

test.describe('1. Тип справки', { tag: ['@web-profile-ssr', '@core-applications'] }, () => {
  test('1.1 — валидный тип «По месту работы родителей» разблокирует поле выдачи @smoke', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, 'По месту работы родителей');
    await expect(pickupFormControl(page)).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('1.2 — валидный тип «РЖД» разблокирует поле выдачи', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, 'РЖД');
    await expect(pickupFormControl(page)).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('1.3 — тип с пробелами по краям принимается корректно', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, '  По месту работы  ');
    await page.getByTestId('reference-type-input').press('Tab');
    await expect(pickupFormControl(page)).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('1.4 — пользовательский тип «Справка для архива» принимается (freeSolo)', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, 'Справка для архива');
    await page.getByTestId('reference-type-input').press('Tab');
    await togglePdf(page);
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test('1.5 — пустой тип держит кнопку «Заказать» disabled', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('1.6 — тип из одних пробелов держит кнопку «Заказать» disabled', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, '   ');
    await page.getByTestId('reference-type-input').press('Tab');
    await expect(submitBtn(page)).toBeDisabled();
  });

  test('1.7 — промежуточный ввод «По» показывает варианты, содержащие «По»', async ({ authenticatedPage: page }) => {
    // Компонент показывает все опции когда хоть одна начинается с введённого текста —
    // проверяем что нужные варианты присутствуют в списке.
    await page.goto(REFERENCES_URL);
    await fillType(page, 'По');
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    await expect(listbox.locator('[role="option"]').filter({ hasText: 'По месту работы' }).first()).toBeVisible();
    await expect(
      listbox.locator('[role="option"]').filter({ hasText: 'По месту работы родителей' }).first(),
    ).toBeVisible();
  });

  test('1.8 — ввод в нижнем регистре «по месту работы» принимается (регистронезависимо)', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, 'по месту работы');
    const option = page.locator('[role="listbox"] [role="option"]').filter({ hasText: /по месту работы/i });
    await expect(option.first()).toBeVisible();
    await option.first().click();
    await togglePdf(page);
    await expect(submitBtn(page)).not.toBeDisabled();
  });
});
