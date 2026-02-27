// lib/queue/processors/cache-warming.processor.ts - Cache Warming Job
import { Job } from 'bullmq';
import { prisma } from '@/lib/db';
import { createCachedAnalyticsService } from '@/lib/analytics/cached-service';

interface CacheWarmingJobData {
  userId?: string; // Specific user, or all users if not provided
  aggressive?: boolean; // Warm more date ranges
}

export async function processCacheWarmingJob(job: Job<CacheWarmingJobData>) {
  const { userId, aggressive = false } = job.data;

  console.log('[Cache Warming] Starting cache warming job');

  try {
    let userIds: string[];

    if (userId) {
      // Warm cache for specific user
      userIds = [userId];
    } else {
      // Warm cache for all active users
      const users = await prisma.user.findMany({
        where: {
          accounts: {
            some: {
              providerId: 'github',
            },
          },
        },
        select: { id: true },
        take: aggressive ? 1000 : 50, // Limit based on aggressiveness
      });

      userIds = users.map((u) => u.id);
    }

    console.log(`[Cache Warming] Warming cache for ${userIds.length} users`);

    // Warm cache for each user
    let warmed = 0;
    for (const uid of userIds) {
      try {
        const analytics = createCachedAnalyticsService(uid);
        await analytics.warmCache();
        warmed++;

        // Update progress
        await job.updateProgress((warmed / userIds.length) * 100);
      } catch (error) {
        console.error(
          `[Cache Warming] Error warming cache for user ${uid}:`,
          error,
        );
        // Continue with other users
      }
    }

    console.log(
      `[Cache Warming] Successfully warmed cache for ${warmed}/${userIds.length} users`,
    );

    return {
      success: true,
      usersWarmed: warmed,
      totalUsers: userIds.length,
    };
  } catch (error) {
    console.error('[Cache Warming] Error in cache warming job:', error);
    throw error;
  }
}
