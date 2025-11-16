async function globalTeardown() {
  // This runs once after all tests
  // Clean up test databases, close connections, etc.
  console.log('Global teardown: Cleaning up test environment...');

  // Example: Clean up test database mocks here
  // await cleanupTestDatabase();

  console.log('Global teardown: Test environment cleaned');
}

export default globalTeardown;
