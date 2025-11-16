import { test, expect } from '@playwright/test';
import { DatabaseMock } from './helpers/test-helpers';

/**
 * Example test showing how to mock database services
 * This demonstrates the pattern for when you add database connections
 */
test.describe('Example: E2E with Database Mock', () => {
  test.beforeEach(() => {
    // Clear any previous mocks
    DatabaseMock.clearMocks();
    
    // Example: Mock database responses
    // In a real scenario, you would set up your database mock here
    // DatabaseMock.setMock('user.findById', { id: 1, name: 'Test User' });
  });

  test('should handle database-backed API calls', async ({ request }) => {
    // Example test structure for when you have database-backed endpoints
    // This shows the pattern - adapt when you add actual database services
    
    // Mock the database response
    DatabaseMock.setMock('getUserData', { id: 1, name: 'Test User' });
    
    // Make API call that would normally hit the database
    // const response = await request.get('http://localhost:4000/api/users/1');
    // expect(response.status()).toBe(200);
    // const data = await response.json();
    // expect(data.name).toBe('Test User');
    
    // For now, just test the basic endpoint
    const response = await request.get('http://localhost:4000/');
    expect(response.status()).toBe(200);
  });

  test('should handle database errors gracefully', async ({ request }) => {
    // Example: Mock database error
    // DatabaseMock.setMock('getUserData', new Error('Database connection failed'));
    
    // Test error handling
    // const response = await request.get('http://localhost:4000/api/users/999');
    // expect(response.status()).toBe(500);
    
    // For now, test 404 handling
    const response = await request.get('http://localhost:4000/non-existent');
    expect(response.status()).toBe(404);
  });
});

