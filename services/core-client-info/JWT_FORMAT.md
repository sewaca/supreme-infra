# JWT Format Documentation

## JWT Structure

The service expects JWT tokens in standard format: `header.payload.signature`

All tokens are signed using **HS256** algorithm with the secret key from `JWT_SECRET` environment variable.

## Payload Format

```typescript
{
  "sub": number,        // User ID (subject)
  "email": string,      // User email
  "name": string,       // User full name
  "role": string,       // User role: "user" | "moderator" | "admin"
  "iat": number,        // Issued at (Unix timestamp)
  "exp": number         // Expires at (Unix timestamp)
}
```

## Example Payload

```json
{
  "sub": 1,
  "email": "vsevolod.bulgakov@example.com",
  "name": "Всеволод Булгаков",
  "role": "user",
  "iat": 1709985600,
  "exp": 1741521600
}
```

## Local Development Secret

For local development, the default JWT secret is:

```
local-development-secret
```

This is configured in `app/config.py`:

```python
jwt_secret: str = "local-development-secret"
```

## Example Test JWT

For testing with user ID `550e8400-e29b-41d4-a716-446655440000`:

**Payload:**

```json
{
  "sub": 1,
  "email": "vsevolod.bulgakov@example.com",
  "name": "Всеволод Булгаков",
  "role": "user",
  "iat": 1709985600,
  "exp": 1741521600
}
```

**Full JWT Token:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnNldm9sb2QuYnVsZ2Frb3ZAZXhhbXBsZS5jb20iLCJuYW1lIjoi0JLRgdC10LLQvtC70L7QtCDQkdGD0LvQs9Cw0LrQvtCyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDk5ODU2MDAsImV4cCI6MTc0MTUyMTYwMH0.8xHqnKimVJW8rZ5JvVvhZ9YvGx4vQE5rJ8sK9mN2pLo
```

This token:

- Is valid until 2029-03-10
- Uses the local development secret
- Can be used for all test API requests

## Generating Custom JWT Tokens

### Using Python (PyJWT)

```python
import jwt
from datetime import datetime, timedelta

payload = {
    "sub": 1,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user",
    "iat": int(datetime.utcnow().timestamp()),
    "exp": int((datetime.utcnow() + timedelta(days=365)).timestamp())
}

token = jwt.encode(payload, "local-development-secret", algorithm="HS256")
print(token)
```

### Using Node.js (jsonwebtoken)

```javascript
const jwt = require("jsonwebtoken");

const payload = {
  sub: 1,
  email: "test@example.com",
  name: "Test User",
  role: "user",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
};

const token = jwt.sign(payload, "local-development-secret");
console.log(token);
```

### Using jwt.io

1. Go to https://jwt.io/
2. Select algorithm: **HS256**
3. Enter the payload in the "Decoded" section
4. Enter secret: `local-development-secret` in the "Verify Signature" section
5. Copy the generated token from the "Encoded" section

## JWT Validation in FastAPI

The service validates JWT tokens using the following logic:

1. Extract token from `Authorization: Bearer <token>` header
2. Verify signature using `JWT_SECRET`
3. Check expiration (`exp` claim)
4. Extract user info from payload
5. Use `sub` (user ID) for authorization checks

## Security Notes

- **Production:** Always use a strong, randomly generated secret (minimum 32 characters)
- **Rotation:** Implement key rotation strategy for production environments
- **Storage:** Never commit production secrets to version control
- **HTTPS:** Always use HTTPS in production to prevent token interception
- **Expiration:** Set reasonable expiration times (e.g., 1 hour for access tokens)

## Mapping user_id

Note: The API uses `user_id` as a query parameter (UUID format), but the JWT `sub` field contains the numeric user ID. In production, you would typically:

1. Use JWT `sub` as the primary user identifier
2. Map it to UUID in the database if needed
3. Or use the same ID format in both JWT and database

For testing purposes, we use:

- JWT `sub`: `1` (numeric ID from auth system)
- Query param `user_id`: `550e8400-e29b-41d4-a716-446655440000` (UUID in client info database)

In production, implement proper ID mapping or use consistent ID format across services.
