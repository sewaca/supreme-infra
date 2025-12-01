import { expect, test } from '@playwright/test';

test.describe('Posts List Page', () => {
  test('should display all posts with truncated bodies', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page).toHaveTitle(/Supreme-Infra application/);

    // Check that posts are displayed
    await expect(page.locator('h1')).toContainText('Posts');

    // Verify mock posts are displayed
    await expect(page.locator('text=Mock Post 1')).toBeVisible();
    await expect(page.locator('text=Mock Post 2')).toBeVisible();
    await expect(page.locator('text=Mock Post 3')).toBeVisible();

    // Verify body truncation (first post has long body, should be truncated)
    // The full text should not be visible as a complete string
    const post1FullBody = page.locator('text="This is a longer body text for mock post 1 that should be truncated in summary"');
    await expect(post1FullBody).not.toBeVisible();
    
    // Should show truncated version (first 20 chars + "...")
    const truncatedText = page.locator('text="This is a longer bod..."');
    await expect(truncatedText).toBeVisible();

    // Verify comments count is displayed (post 1 has 2 comments, post 2 has 1)
    await expect(page.locator('text=/2.*comment/i')).toBeVisible();
    await expect(page.locator('text=/1.*comment/i')).toBeVisible();
  });

  test('should filter posts by userId', async ({ page }) => {
    // Navigate to filtered view
    await page.goto('/?userId=1');

    // Wait for posts to load
    await expect(page.locator('h1')).toContainText('Posts');

    // Should only show posts from user 1
    await expect(page.locator('text=Mock Post 1')).toBeVisible();
    await expect(page.locator('text=Mock Post 2')).toBeVisible();
    
    // Should not show post from user 2
    await expect(page.locator('text=Mock Post 3')).not.toBeVisible();

    // Verify breadcrumbs show user filter
    await expect(page.locator('text=user 1')).toBeVisible();
  });

  test('should navigate to post details when clicking a post', async ({ page }) => {
    await page.goto('/');

    // Wait for posts to load
    await expect(page.locator('text=Mock Post 1')).toBeVisible();

    // Click on first post
    await page.locator('text=Mock Post 1').click();

    // Verify navigation to post details page
    await expect(page).toHaveURL(/\/1$/);

    // Verify post details are displayed
    await expect(page.locator('h1')).toContainText('Mock Post 1');
    
    // Verify full body is shown (not truncated)
    await expect(page.locator('text=This is a longer body text for mock post 1 that should be truncated in summary')).toBeVisible();
  });
});

test.describe('Post Details Page', () => {
  test('should display post details with full body and comments', async ({ page }) => {
    await page.goto('/1');

    // Verify post title
    await expect(page.locator('h1')).toContainText('Mock Post 1');

    // Verify full body is displayed (not truncated)
    await expect(
      page.locator('text=This is a longer body text for mock post 1 that should be truncated in summary'),
    ).toBeVisible();

    // Verify comments are displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Great post!')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=I completely agree with this.')).toBeVisible();
  });

  test('should display breadcrumbs correctly', async ({ page }) => {
    await page.goto('/1');

    // Verify breadcrumbs navigation
    await expect(page.locator('nav').locator('text=all posts')).toBeVisible();
    await expect(page.locator('nav').locator('text=user 1')).toBeVisible();
    await expect(page.locator('nav').locator('text=Mock Post 1')).toBeVisible();

    // Click on "all posts" breadcrumb
    await page.locator('text=all posts').click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate back to user posts via breadcrumb', async ({ page }) => {
    await page.goto('/1');

    // Click on user breadcrumb
    await page.locator('text=user 1').click();

    // Should navigate to filtered posts
    await expect(page).toHaveURL('/?userId=1');
    await expect(page.locator('h1')).toContainText('Posts');
  });

  test('should display post with no comments', async ({ page }) => {
    await page.goto('/3');

    // Verify post is displayed
    await expect(page.locator('h1')).toContainText('Mock Post 3');

    // Verify no comments section or empty state
    // Post 3 has no comments in mock data
    await expect(page.locator('text=John Doe')).not.toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 for non-existent post', async ({ page }) => {
    await page.goto('/999');

    // Should show 404 page - Next.js default shows "404"
    await expect(page.locator('text="404"')).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid post ID', async ({ page }) => {
    await page.goto('/invalid');

    // Should show 404 page for invalid IDs - Next.js default shows "404"
    await expect(page.locator('text="404"')).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid userId parameter', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    // Backend should return 400 for invalid userId
    const backendResponse = await page.request.get(
      `${backendUrl}/posts/get-summary?userId=invalid`,
    );
    
    // Backend should return 400 Bad Request
    expect(backendResponse.status()).toBe(400);
    
    // Frontend should handle this gracefully
    await page.goto('/?userId=invalid');
    // Page might show error or handle gracefully - just verify it doesn't crash
    await expect(page).toHaveTitle(/Supreme-Infra application/);
  });
});

test.describe('Backend API Integration', () => {
  test('should return posts summary with correct structure', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    const response = await page.request.get(`${backendUrl}/posts/get-summary`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Verify response structure
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Verify post structure
    const post = data[0];
    expect(post).toHaveProperty('id');
    expect(post).toHaveProperty('userId');
    expect(post).toHaveProperty('title');
    expect(post).toHaveProperty('body');
    expect(post).toHaveProperty('commentsCount');
    
    // Verify body truncation (should be max 23 chars: 20 + "...")
    expect(post.body.length).toBeLessThanOrEqual(23);
    if (post.body.length > 20) {
      expect(post.body).toMatch(/\.\.\.$/);
    }
  });

  test('should return post details with comments', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    const response = await page.request.get(`${backendUrl}/posts/1`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('body');
    expect(data).toHaveProperty('comments');
    expect(Array.isArray(data.comments)).toBe(true);
    
    // Verify comment structure
    if (data.comments.length > 0) {
      const comment = data.comments[0];
      expect(comment).toHaveProperty('id');
      expect(comment).toHaveProperty('postId');
      expect(comment).toHaveProperty('name');
      expect(comment).toHaveProperty('email');
      expect(comment).toHaveProperty('body');
    }
  });

  test('should return 404 for non-existent post', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    const response = await page.request.get(`${backendUrl}/posts/999`);
    
    expect(response.status()).toBe(404);
  });

  test('should filter posts by userId', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    const response = await page.request.get(`${backendUrl}/posts/get-summary?userId=1`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // All posts should be from user 1
    expect(Array.isArray(data)).toBe(true);
    data.forEach((post: { userId: number }) => {
      expect(post.userId).toBe(1);
    });
  });

  test('should return 400 for invalid userId parameter', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    const response = await page.request.get(`${backendUrl}/posts/get-summary?userId=invalid`);
    
    expect(response.status()).toBe(400);
  });

  test('should return 400 for invalid post ID', async ({ page }) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    const response = await page.request.get(`${backendUrl}/posts/invalid`);
    
    expect(response.status()).toBe(400);
  });
});
