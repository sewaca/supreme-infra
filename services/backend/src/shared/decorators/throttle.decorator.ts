import { Throttle } from '@nestjs/throttler';

// Strict rate limiting for authentication endpoints
export const ThrottleAuth = () => Throttle({ default: { limit: 5, ttl: 60000 } }); // 5 requests per minute

// Moderate rate limiting for data modification endpoints
export const ThrottleModify = () => Throttle({ default: { limit: 20, ttl: 60000 } }); // 20 requests per minute

// Relaxed rate limiting for read endpoints
export const ThrottleRead = () => Throttle({ default: { limit: 100, ttl: 60000 } }); // 100 requests per minute

