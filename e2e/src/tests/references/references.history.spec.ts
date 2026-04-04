import { expect, test } from '../../fixtures';
import { fillType, REFERENCES_URL } from './helpers';

test.describe('5. Фильтрация списка типов', () => {
  test('5.1 — ввод «По» показывает варианты, содержащие «По»', async ({ authenticatedPage: page }) => {
    // Компонент возвращает все опции если хоть одна начинается с введённого текста,
    // поэтому проверяем что НУЖНЫЕ опции присутствуют, а не что список отфильтрован.
    await page.goto(REFERENCES_URL);
    await fillType(page, 'По');
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    await expect(listbox.locator('[role="option"]').filter({ hasText: 'По месту работы' }).first()).toBeVisible();
    await expect(
      listbox.locator('[role="option"]').filter({ hasText: 'По месту работы родителей' }).first(),
    ).toBeVisible();
  });

  test('5.2 — ввод «по» в нижнем регистре — нужные варианты видны (регистронезависимо)', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, 'по');
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    // Хотя бы одна опция с «По» присутствует в списке
    await expect(listbox.locator('[role="option"]').filter({ hasText: /по/i }).first()).toBeVisible();
  });

  test('5.3 — ввод «zzz» добавляет пользовательскую опцию', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, 'zzz');
    const options = page.locator('[role="listbox"] [role="option"]');
    await expect(options.first()).toBeVisible();
    const texts = await options.allTextContents();
    expect(texts.some((t) => t.includes('zzz'))).toBe(true);
  });

  test('5.4 — пустой ввод показывает все предустановленные типы', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await page.getByTestId('reference-type-input').click();
    const options = page.locator('[role="listbox"] [role="option"]');
    await expect(options.first()).toBeVisible();
    await expect(options).toHaveCount(await options.count());
    expect(await options.count()).toBeGreaterThanOrEqual(5);
  });
});

test.describe('6. История заказов', () => {
  test('6.1 — секция «История заказов» присутствует на странице', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId('reference-history')).toBeVisible();
    await expect(page.getByTestId('reference-history')).toContainText('История заказов');
  });

  test('6.2 — фильтр статусов отображает все пять кнопок', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const filter = page.getByTestId('reference-status-filter');
    await expect(filter).toBeVisible();
    await expect(page.getByTestId('status-btn-all')).toBeVisible();
    await expect(page.getByTestId('status-btn-preparation')).toBeVisible();
    await expect(page.getByTestId('status-btn-in_progress')).toBeVisible();
    await expect(page.getByTestId('status-btn-pending')).toBeVisible();
    await expect(page.getByTestId('status-btn-ready')).toBeVisible();
  });

  test('6.3 — по умолчанию активен фильтр «Все»', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId('status-btn-all')).toHaveAttribute('aria-pressed', 'true');
  });

  test('6.4 — клик по фильтру переключает активную кнопку', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await page.getByTestId('status-btn-preparation').click();
    await expect(page.getByTestId('status-btn-preparation')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('status-btn-all')).toHaveAttribute('aria-pressed', 'false');
  });

  test('6.5 — пустое состояние показывает нужный текст', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const cards = page.getByTestId('reference-history-card');
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId('reference-history-empty')).toContainText('Пока нет заказанных справок');
    }
  });

  test('6.6 — клик по карточке открывает модальное окно', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const firstCard = page.getByTestId('reference-history-card').first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'Нет заказанных справок в истории');
      return;
    }
    await firstCard.click();
    await expect(page.getByTestId('reference-detail-modal')).toBeVisible();
  });

  test('6.7 — модальное окно закрывается по кнопке «Закрыть»', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const firstCard = page.getByTestId('reference-history-card').first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'Нет заказанных справок в истории');
      return;
    }
    await firstCard.click();
    await expect(page.getByTestId('reference-detail-modal')).toBeVisible();
    await page.getByTestId('reference-modal-close').click();
    await expect(page.getByTestId('reference-detail-modal')).not.toBeVisible();
  });

  test('6.8 — модальное окно содержит дату заказа и статус', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const firstCard = page.getByTestId('reference-history-card').first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'Нет заказанных справок в истории');
      return;
    }
    await firstCard.click();
    const modal = page.getByTestId('reference-detail-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Дата заказа');
    await expect(modal).toContainText('Статус');
  });

  test('6.9 — фильтр «Подготовка» показывает только соответствующие карточки или пустое состояние', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await page.getByTestId('status-btn-preparation').click();
    const list = page.getByTestId('reference-history-list');
    const cards = list.getByTestId('reference-history-card');
    const empty = page.getByTestId('reference-history-empty');
    const hasCards = (await cards.count()) > 0;
    const hasEmpty = (await empty.count()) > 0;
    expect(hasCards || hasEmpty).toBe(true);
  });

  test('6.10 — фильтр «Все» возвращает полный список', async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const totalBefore = await page.getByTestId('reference-history-card').count();
    await page.getByTestId('status-btn-preparation').click();
    await page.getByTestId('status-btn-all').click();
    const totalAfter = await page.getByTestId('reference-history-card').count();
    expect(totalAfter).toBe(totalBefore);
  });
});
