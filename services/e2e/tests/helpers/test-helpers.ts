import { Page, APIRequestContext } from '@playwright/test';

/**
 * Helper function to wait for backend to be ready
 */
export async function waitForBackend(apiContext: APIRequestContext, maxRetries = 10): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await apiContext.get('http://localhost:4000/');
      if (response.status() === 200) {
        return;
      }
    } catch (error) {
      // Backend not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Backend did not become ready in time');
}

/**
 * Helper function to wait for frontend to be ready
 */
export async function waitForFrontend(page: Page, maxRetries = 10): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto('/', { timeout: 5000 });
      return;
    } catch (error) {
      // Frontend not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Frontend did not become ready in time');
}

/**
 * Mock database helper - use this to mock database calls in tests
 */
export class DatabaseMock {
  private static mocks: Map<string, any> = new Map();

  static setMock(key: string, value: any): void {
    this.mocks.set(key, value);
  }

  static getMock(key: string): any {
    return this.mocks.get(key);
  }

  static clearMocks(): void {
    this.mocks.clear();
  }
}

