// lib/cache/redis-cache.ts - Enhanced Redis Cache Manager
import { redis } from '@/lib/redis';

export class RedisCache {
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL (in seconds)
   */
  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
    }
  }

  /**
   * Delete cached value
   */
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
    }
  }

  /**
   * Get or set pattern: fetch from cache, or compute and cache if not found
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${key}`);

    // Fetch fresh data
    const data = await fetcher();

    // Cache it
    await this.set(key, data, ttl);

    return data;
  }

  /**
   * Increment counter (for rate limiting)
   */
  static async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redis.incr(key);

      if (ttl && value === 1) {
        await redis.expire(key, ttl);
      }

      return value;
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error checking existence of ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiry on existing key
   */
  static async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl);
    } catch (error) {
      console.error(`[Cache] Error setting expiry on ${key}:`, error);
    }
  }

  /**
   * Get remaining TTL
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error(`[Cache] Error getting TTL for ${key}:`, error);
      return -1;
    }
  }

  /**
   * Multi-get (get multiple keys at once)
   */
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.mget(...keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (error) {
      console.error(`[Cache] Error getting multiple keys:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Multi-set (set multiple keys at once)
   */
  static async mset(
    entries: Array<{ key: string; value: any; ttl?: number }>,
  ): Promise<void> {
    try {
      const pipeline = redis.pipeline();

      entries.forEach(({ key, value, ttl }) => {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });

      await pipeline.exec();
    } catch (error) {
      console.error(`[Cache] Error setting multiple keys:`, error);
    }
  }
}

/**
 * Cache key builders
 */
export const CacheKeys = {
  // User-specific
  userOverview: (userId: string, from?: string, to?: string) =>
    `user:${userId}:overview${from && to ? `:${from}:${to}` : ''}`,

  userTrends: (userId: string, from?: string, to?: string) =>
    `user:${userId}:trends${from && to ? `:${from}:${to}` : ''}`,

  userLanguages: (userId: string, from?: string, to?: string) =>
    `user:${userId}:languages${from && to ? `:${from}:${to}` : ''}`,

  userTimeline: (userId: string, limit: number = 50) =>
    `user:${userId}:timeline:${limit}`,

  userRepositories: (userId: string, limit: number = 50) =>
    `user:${userId}:repositories:${limit}`,

  // GitHub API cache
  githubRepos: (userId: string) => `github:${userId}:repos`,

  githubCommits: (userId: string, repo: string) =>
    `github:${userId}:commits:${repo}`,

  githubPRs: (userId: string, repo: string) => `github:${userId}:prs:${repo}`,

  // Rate limiting
  rateLimit: (identifier: string, action: string) =>
    `ratelimit:${action}:${identifier}`,

  // Job status
  jobStatus: (jobId: string) => `job:${jobId}:status`,

  // Sync status
  syncStatus: (userId: string) => `sync:${userId}:status`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  WEEK: 604800, // 7 days
};
