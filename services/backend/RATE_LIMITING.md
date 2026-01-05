# Rate Limiting Documentation

## How It Works

### Default Behavior: Per IP Address

By default, `@nestjs/throttler` uses **IP address** as the tracking key. This means:

```
✅ Each IP address gets its own rate limit counter
✅ User A (IP: 1.1.1.1) can make 100 requests/minute
✅ User B (IP: 2.2.2.2) can make 100 requests/minute
✅ User C (IP: 3.3.3.3) can make 100 requests/minute

❌ NOT 100 requests total from all users combined
```

### Example Scenario

**Configuration:**
```typescript
limit: 100,  // requests
ttl: 60000,  // 60 seconds (1 minute)
```

**What happens:**

| Time | User A (IP: 1.1.1.1) | User B (IP: 2.2.2.2) | Result |
|------|---------------------|---------------------|--------|
| 0:00 | Makes 50 requests | Makes 50 requests | ✅ Both allowed |
| 0:30 | Makes 50 more (total: 100) | Makes 50 more (total: 100) | ✅ Both allowed |
| 0:45 | Makes 1 more (total: 101) | Still at 100 | ❌ User A blocked, User B allowed |
| 1:00 | Counter resets to 0 | Counter resets to 0 | ✅ Both can make 100 more |

### Current Configuration

#### Global Rate Limit (All Endpoints)
```typescript
ttl: 60000,    // 60 seconds
limit: 100     // 100 requests per IP per minute
```

#### Auth Endpoints (Login/Register)
```typescript
@ThrottleAuth()
ttl: 60000,    // 60 seconds
limit: 5       // 5 requests per IP per minute
```

**Why strict for auth?**
- Prevents brute-force password attacks
- Prevents account enumeration
- Protects against credential stuffing

#### Example:
- User tries to login with wrong password 5 times → **BLOCKED for 1 minute**
- After 1 minute → Can try 5 more times

---

## How Throttler Identifies Users

### 1. By IP Address (Default)

**How it works:**
```typescript
// Throttler extracts IP from request
const ip = request.ip; // e.g., "192.168.1.1"
const key = `throttler:${ip}:${route}`;
```

**Pros:**
- ✅ Simple
- ✅ Works for anonymous users
- ✅ No authentication required

**Cons:**
- ⚠️ Users behind same NAT share the same IP
- ⚠️ VPN users can change IP to bypass
- ⚠️ Mobile users get new IP when switching networks

### 2. By User ID (For Authenticated Routes)

You can customize throttler to use User ID instead of IP:

```typescript
// Custom throttler guard
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // If user is authenticated, use user ID
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    // Otherwise, fall back to IP
    return req.ip;
  }
}
```

**Pros:**
- ✅ Accurate per-user tracking
- ✅ Can't bypass by changing IP
- ✅ Fair limits for users behind NAT

**Cons:**
- ⚠️ Only works for authenticated routes
- ⚠️ Anonymous users still tracked by IP

### 3. By JWT Token

For API keys or JWT tokens:

```typescript
protected async getTracker(req: Record<string, any>): Promise<string> {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    return `token:${token}`;
  }
  return req.ip;
}
```

---

## Storage

### Default: In-Memory Storage

By default, throttler stores counters in **memory**:

```typescript
// Stored in Node.js process memory
{
  "throttler:192.168.1.1:/auth/login": {
    count: 3,
    expiresAt: 1704567890000
  },
  "throttler:192.168.1.2:/auth/login": {
    count: 1,
    expiresAt: 1704567890000
  }
}
```

**Pros:**
- ✅ Fast
- ✅ No external dependencies
- ✅ Simple setup

**Cons:**
- ⚠️ Lost on server restart
- ⚠️ Not shared between multiple server instances
- ⚠️ Uses server memory

### Redis Storage (For Production)

For production with multiple servers, use Redis:

```typescript
import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';

ThrottlerModule.forRoot({
  throttlers: [{ ttl: 60000, limit: 100 }],
  storage: new ThrottlerStorageRedisService('redis://localhost:6379'),
});
```

**Pros:**
- ✅ Shared between all server instances
- ✅ Persists across restarts
- ✅ Scalable

**Cons:**
- ⚠️ Requires Redis server
- ⚠️ Slightly slower (network call)

---

## Behind Reverse Proxy / Load Balancer

### Problem

When behind a proxy (like Nginx, Cloudflare), all requests appear to come from the proxy's IP:

```
User A (1.1.1.1) → Nginx (10.0.0.1) → Backend sees: 10.0.0.1
User B (2.2.2.2) → Nginx (10.0.0.1) → Backend sees: 10.0.0.1
```

All users appear as the same IP! 😱

### Solution: Trust Proxy Headers

Configure Fastify to trust proxy headers:

```typescript
// main.ts
const fastifyAdapter = new FastifyAdapter({
  trustProxy: true, // Trust X-Forwarded-For header
});
```

Then Nginx should forward the real IP:

```nginx
# nginx.conf
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Now backend sees the real user IP:
```
User A → Nginx → Backend sees: 1.1.1.1 (from X-Forwarded-For)
User B → Nginx → Backend sees: 2.2.2.2 (from X-Forwarded-For)
```

---

## Testing Rate Limiting

### Test with curl

```bash
# Make 6 requests quickly to /auth/login (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:4000/main-api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done
```

**Expected output:**
```
Request 1-5: Status 401 (Unauthorized - wrong password)
Request 6: Status 429 (Too Many Requests - rate limited!)
```

### Test with different IPs

```bash
# Request 1 from IP 1.1.1.1
curl -X POST http://localhost:4000/main-api/auth/login \
  -H "X-Forwarded-For: 1.1.1.1" \
  -d '{"email":"test@test.com","password":"wrong"}'

# Request 2 from IP 2.2.2.2 (different IP)
curl -X POST http://localhost:4000/main-api/auth/login \
  -H "X-Forwarded-For: 2.2.2.2" \
  -d '{"email":"test@test.com","password":"wrong"}'
```

Both should work because they're from different IPs!

---

## Response Headers

Throttler adds helpful headers to responses:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100          # Maximum requests allowed
X-RateLimit-Remaining: 95       # Requests remaining
X-RateLimit-Reset: 1704567890   # Unix timestamp when limit resets
```

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704567890
Retry-After: 45                 # Seconds until you can retry

{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## Bypassing Rate Limits (For Testing)

### Skip throttling for specific routes

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Get('health')
@SkipThrottle() // No rate limiting for health checks
getHealth() {
  return { status: 'ok' };
}
```

### Skip throttling for specific IPs

```typescript
// Custom guard
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    
    // Whitelist internal IPs
    const whitelist = ['127.0.0.1', '10.0.0.0/8'];
    if (whitelist.includes(ip)) {
      return true;
    }
    
    return false;
  }
}
```

---

## Summary

| Aspect | Current Implementation |
|--------|----------------------|
| **Tracking Method** | IP Address |
| **Storage** | In-Memory (per server instance) |
| **Global Limit** | 100 requests/minute per IP |
| **Auth Limit** | 5 requests/minute per IP |
| **Proxy Support** | ✅ Enabled via `trustProxy: true` |
| **Redis** | ❌ Not configured (recommended for production) |

### Recommendations for Production

1. ✅ **Use Redis storage** for multi-server deployments
2. ✅ **Configure proxy headers** in Nginx/Load Balancer
3. ✅ **Monitor rate limit hits** in logs
4. ✅ **Consider user-based tracking** for authenticated routes
5. ✅ **Whitelist monitoring/health check IPs**

---

## References

- [@nestjs/throttler Documentation](https://docs.nestjs.com/security/rate-limiting)
- [Throttler Storage Redis](https://github.com/kkoomen/nestjs-throttler-storage-redis)

