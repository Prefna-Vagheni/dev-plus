// lib/cache/invalidation.ts - Cache Invalidation Service
import { RedisCache, CacheKeys } from './redis-cache';

export class CacheInvalidation {
  /**
   * Invalidate all user caches
   */
  static async invalidateUser(userId: string): Promise<void> {
    console.log(`[Cache] Invalidating all caches for user ${userId}`);

    await RedisCache.deletePattern(`user:${userId}:*`);
    await RedisCache.deletePattern(`github:${userId}:*`);
    await RedisCache.deletePattern(`sync:${userId}:*`);
  }

  /**
   * Invalidate user analytics caches
   */
  static async invalidateUserAnalytics(userId: string): Promise<void> {
    console.log(`[Cache] Invalidating analytics for user ${userId}`);

    const patterns = [
      `user:${userId}:overview*`,
      `user:${userId}:trends*`,
      `user:${userId}:languages*`,
      `user:${userId}:timeline*`,
    ];

    await Promise.all(
      patterns.map((pattern) => RedisCache.deletePattern(pattern)),
    );
  }

  /**
   * Invalidate specific repository cache
   */
  static async invalidateRepository(
    userId: string,
    repo: string,
  ): Promise<void> {
    console.log(`[Cache] Invalidating cache for repo ${repo}`);

    await Promise.all([
      RedisCache.delete(CacheKeys.githubCommits(userId, repo)),
      RedisCache.delete(CacheKeys.githubPRs(userId, repo)),
      RedisCache.deletePattern(`user:${userId}:repositories*`),
    ]);
  }

  /**
   * Invalidate GitHub API cache
   */
  static async invalidateGitHubCache(userId: string): Promise<void> {
    console.log(`[Cache] Invalidating GitHub cache for user ${userId}`);

    await RedisCache.deletePattern(`github:${userId}:*`);
  }

  /**
   * Invalidate after sync completes
   */
  static async invalidateAfterSync(userId: string): Promise<void> {
    console.log(`[Cache] Invalidating caches after sync for user ${userId}`);

    // Invalidate analytics (new data available)
    await this.invalidateUserAnalytics(userId);

    // Invalidate timeline (new activities)
    await RedisCache.deletePattern(`user:${userId}:timeline*`);

    // Invalidate repositories list
    await RedisCache.deletePattern(`user:${userId}:repositories*`);
  }

  /**
   * Invalidate after aggregation
   */
  static async invalidateAfterAggregation(userId: string): Promise<void> {
    console.log(
      `[Cache] Invalidating caches after aggregation for user ${userId}`,
    );

    // Invalidate all analytics (stats updated)
    await this.invalidateUserAnalytics(userId);
  }

  /**
   * Smart invalidation: only invalidate affected caches
   */
  static async invalidateByEventType(
    userId: string,
    eventType: 'COMMIT' | 'PULL_REQUEST' | 'ISSUE' | 'REPOSITORY',
  ): Promise<void> {
    console.log(`[Cache] Smart invalidation for ${eventType} event`);

    switch (eventType) {
      case 'COMMIT':
        // Commits affect overview and trends
        await RedisCache.deletePattern(`user:${userId}:overview*`);
        await RedisCache.deletePattern(`user:${userId}:trends*`);
        await RedisCache.deletePattern(`user:${userId}:timeline*`);
        break;

      case 'PULL_REQUEST':
      case 'ISSUE':
        // PRs/Issues affect overview and timeline
        await RedisCache.deletePattern(`user:${userId}:overview*`);
        await RedisCache.deletePattern(`user:${userId}:timeline*`);
        break;

      case 'REPOSITORY':
        // New repos affect repository list and overview
        await RedisCache.deletePattern(`user:${userId}:repositories*`);
        await RedisCache.deletePattern(`user:${userId}:overview*`);
        break;
    }
  }
}
