import { expect, test } from '@playwright/test';

test.describe('Login page — unauthenticated', () => {
  test('loads with correct heading and subtitle', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('text=Вход в личный кабинет')).toBeVisible();
    await expect(page.locator('text=Введите данные для входа в систему')).toBeVisible();
  });

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows submit button', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('button[type="submit"]')).toContainText('Войти');
  });

  test('shows links to register and forgot password', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('a[href="/register"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test('logs in with correct credentials', async ({ page }) => {
    // Мокаем detectClientInfo() чтобы не ждать внешний запрос к ipregistry
    await page.route('https://api.ipregistry.co/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          location: { country: { name: 'Russia' }, city: 'Saint Petersburg' },
          user_agent: { device: { name: 'Desktop' } },
          ip: '127.0.0.1',
        }),
      }),
    );

    await page.goto('/login');

    await page.locator('input[type="email"]').fill('ivan.ivanov@example.com');
    await page.locator('input[type="password"]').fill('ivan.ivanov@example.com');

    // Кликаем и одновременно ждём ответ от login API
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login') && res.status() === 200),
      page.locator('button[type="submit"]').click(),
    ]);

    await page.waitForURL('**/profile**');
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('text=Иванов Иван')).toBeVisible();
  });

  test('shows error alert on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('nonexistent@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 15000 });
  });
});
