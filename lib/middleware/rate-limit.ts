// lib/middleware/rate-limit.ts - Rate Limiting Middleware
import { NextRequest, NextResponse } from 'next/server';
import { RedisCache, CacheKeys } from '@/lib/cache/redis-cache';

interface RateLimitConfig {
  max: number; // Max requests
  window: number; // Time window in seconds
  message?: string; // Custom error message
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimits = {
  API_DEFAULT: { max: 100, window: 60 }, // 100 requests per minute
  API_ANALYTICS: { max: 30, window: 60 }, // 30 requests per minute
  API_SYNC: { max: 5, window: 300 }, // 5 requests per 5 minutes
  API_GITHUB: { max: 10, window: 60 }, // 10 requests per minute
  WEBSOCKET: { max: 100, window: 60 }, // 100 messages per minute
} as const;

/**
 * Check rate limit for identifier
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = CacheKeys.rateLimit(identifier, action);

  try {
    // Increment counter
    const count = await RedisCache.increment(key, config.window);

    // Check if limit exceeded
    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);
    const resetAt = Date.now() + config.window * 1000;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return { allowed: true, remaining: config.max, resetAt: Date.now() };
  }
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string,
): Promise<NextResponse | null> {
  // Get identifier (IP address or user ID)
  const id =
    identifier ||
    request.ip ||
    request.headers.get('x-forwarded-for') ||
    'anonymous';

  const action = request.nextUrl.pathname;

  // Check rate limit
  const { allowed, remaining, resetAt } = await checkRateLimit(
    id,
    action,
    config,
  );

  // Add rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', config.max.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', resetAt.toString());

  // If not allowed, return 429
  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message:
          config.message || 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers,
      },
    );
  }

  // Allowed - return null to continue
  return null;
}

/**
 * Higher-order function to wrap API route with rate limiting
 */
export function ratelimit(config: RateLimitConfig) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      // Check rate limit
      const rateLimitResponse = await withRateLimit(request, config);

      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Continue to handler
      return handler(request);
    };
  };
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  action: string,
  config: RateLimitConfig,
): Promise<{
  limit: number;
  remaining: number;
  resetAt: number;
  used: number;
}> {
  const key = CacheKeys.rateLimit(identifier, action);

  try {
    const exists = await RedisCache.exists(key);

    if (!exists) {
      return {
        limit: config.max,
        remaining: config.max,
        resetAt: Date.now() + config.window * 1000,
        used: 0,
      };
    }

    const count = parseInt((await RedisCache.get<string>(key)) || '0');
    const ttl = await RedisCache.ttl(key);

    return {
      limit: config.max,
      remaining: Math.max(0, config.max - count),
      resetAt: Date.now() + ttl * 1000,
      used: count,
    };
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit status:', error);
    return {
      limit: config.max,
      remaining: config.max,
      resetAt: Date.now(),
      used: 0,
    };
  }
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(
  identifier: string,
  action: string,
): Promise<void> {
  const key = CacheKeys.rateLimit(identifier, action);
  await RedisCache.delete(key);
}
