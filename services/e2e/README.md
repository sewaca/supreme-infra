# E2E Tests

This directory contains end-to-end tests that test the full application stack from frontend to backend.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Install Playwright browsers (required before running tests):
```bash
pnpm install-browsers
```

Or install all browsers (chromium, firefox, webkit):
```bash
pnpm install-all-browsers
```

**Note:** Browser installation is required. If you see "browser launch failed" errors, run `pnpm install-browsers` first.

## Running Tests

Run all e2e tests:
```bash
pnpm e2e
```

Run tests in UI mode (interactive):
```bash
pnpm e2e:ui
```

Run tests in headed mode (see browser):
```bash
pnpm e2e:headed
```

Debug tests:
```bash
pnpm e2e:debug
```

## Test Structure

- `tests/app.e2e.spec.ts` - Main application e2e tests
- `tests/example-with-db-mock.e2e.spec.ts` - Example showing how to mock database services
- `tests/setup/` - Global setup and teardown hooks
- `tests/helpers/` - Test helper utilities

## How It Works

1. **Starts both services**: The Playwright config automatically starts both frontend and backend servers before running tests
2. **Tests full stack**: Tests interact with the frontend UI and verify backend API responses
3. **Mocks external services**: Only external services like databases should be mocked - the frontend and backend run as real applications

## Mocking Database Services

When you add database connections, use the `DatabaseMock` helper in `tests/helpers/test-helpers.ts`:

```typescript
import { DatabaseMock } from '../helpers/test-helpers';

test('example', async () => {
  DatabaseMock.setMock('user.findById', { id: 1, name: 'Test User' });
  // Your test code here
});
```

## Environment Variables

- `BACKEND_PORT` - Backend server port (default: 4000)
- `FRONTEND_PORT` - Frontend server port (default: 3000)
- `BASE_URL` - Frontend base URL
- `BACKEND_URL` - Backend base URL

