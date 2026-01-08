# @supreme-int/api-client

Shared API client library for authentication and other API calls.

## Features

- Server-side auth utilities (Next.js server components)
- Client-side auth utilities (browser)
- Type-safe API interfaces
- Token management

## Usage

### Server-side (Next.js Server Components)

```typescript
import { getAuthToken, getUser } from '@supreme-int/api-client/server';

export default async function Page() {
  const user = await getUser();
  // ...
}
```

### Client-side

```typescript
import { getAuthToken, setAuthToken, getUserRole } from '@supreme-int/api-client/client';

const token = getAuthToken();
const role = getUserRole();
```

