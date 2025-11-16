import { test, expect } from '@playwright/test';

test.describe('Full Stack E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should load the frontend page', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page content is visible
    const content = page.locator('#test');
    await expect(content).toBeVisible();
    await expect(content).toHaveText('все ок. мама шлюха');
  });
});
