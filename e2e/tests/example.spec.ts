import { expect, test } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Supreme-Infra application/);
});

test('can navigate to post details', async ({ page }) => {
  await page.goto('/');
  // Wait for posts to load
  await page.waitForSelector('text=Post', { timeout: 10000 });
  // Click on first post if available
  const firstPost = page.locator('a').first();
  if ((await firstPost.count()) > 0) {
    await firstPost.click();
    // Verify we're on a post details page
    await expect(page).toHaveURL(/\/\d+/);
  }
});
