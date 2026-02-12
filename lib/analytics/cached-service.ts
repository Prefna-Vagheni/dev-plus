// lib/analytics/cached-service.ts - Cached Analytics Service
import { createAnalyticsService } from './service';
import { RedisCache, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';

export class CachedAnalyticsService {
  constructor(private userId: string) {}

  /**
   * Get overview with caching
   */
  async getOverview(dateRange?: { from: Date; to: Date }) {
    const cacheKey = CacheKeys.userOverview(
      this.userId,
      dateRange?.from.toISOString(),
      dateRange?.to.toISOString(),
    );

    return RedisCache.getOrSet(
      cacheKey,
      async () => {
        const analytics = createAnalyticsService(this.userId);
        return analytics.getOverview(dateRange);
      },
      CacheTTL.MEDIUM, // 5 minutes
    );
  }

  /**
   * Get trends with caching
   */
  async getTrends(dateRange?: { from: Date; to: Date }) {
    const cacheKey = CacheKeys.userTrends(
      this.userId,
      dateRange?.from.toISOString(),
      dateRange?.to.toISOString(),
    );

    return RedisCache.getOrSet(
      cacheKey,
      async () => {
        const analytics = createAnalyticsService(this.userId);
        return analytics.getTrends(dateRange);
      },
      CacheTTL.MEDIUM,
    );
  }

  /**
   * Get language breakdown with caching
   */
  async getLanguageBreakdown(dateRange?: { from: Date; to: Date }) {
    const cacheKey = CacheKeys.userLanguages(
      this.userId,
      dateRange?.from.toISOString(),
      dateRange?.to.toISOString(),
    );

    return RedisCache.getOrSet(
      cacheKey,
      async () => {
        const analytics = createAnalyticsService(this.userId);
        return analytics.getLanguageBreakdown(dateRange);
      },
      CacheTTL.LONG, // 1 hour - languages don't change often
    );
  }

  /**
   * Get activity timeline with caching
   */
  async getActivityTimeline(limit: number = 50) {
    const cacheKey = CacheKeys.userTimeline(this.userId, limit);

    return RedisCache.getOrSet(
      cacheKey,
      async () => {
        const analytics = createAnalyticsService(this.userId);
        return analytics.getActivityTimeline(limit);
      },
      CacheTTL.SHORT, // 1 minute - timeline updates frequently
    );
  }

  /**
   * Get repository activity with caching
   */
  async getRepositoryActivity(dateRange?: { from: Date; to: Date }) {
    const cacheKey = CacheKeys.userRepositories(this.userId);

    return RedisCache.getOrSet(
      cacheKey,
      async () => {
        const analytics = createAnalyticsService(this.userId);
        return analytics.getRepositoryActivity(dateRange);
      },
      CacheTTL.MEDIUM,
    );
  }

  /**
   * Warm cache by pre-fetching common queries
   */
  async warmCache() {
    console.log(`[Cache] Warming cache for user ${this.userId}`);

    // Pre-fetch common date ranges
    const now = new Date();
    const last7Days = {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: now,
    };
    const last30Days = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: now,
    };

    await Promise.all([
      this.getOverview(last30Days),
      this.getTrends(last30Days),
      this.getLanguageBreakdown(last30Days),
      this.getActivityTimeline(50),
      this.getRepositoryActivity(last30Days),
      // Also warm 7-day cache
      this.getOverview(last7Days),
      this.getTrends(last7Days),
    ]);

    console.log(`[Cache] Cache warming completed for user ${this.userId}`);
  }
}

/**
 * Create cached analytics service instance
 */
export function createCachedAnalyticsService(userId: string) {
  return new CachedAnalyticsService(userId);
}
