// lib/queue/scheduler.ts - Cron job scheduler
import cron from 'node-cron';
import { addJob } from './config';
import { prisma } from '@/lib/db';

/**
 * Schedule daily sync for all users
 * Runs every day at 2:00 AM
 */
export function scheduleDailySync() {
  return cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Running daily sync for all users');

    try {
      // Get all users with GitHub accounts
      const users = await prisma.user.findMany({
        where: {
          accounts: {
            some: {
              providerId: 'github',
            },
          },
        },
        select: {
          id: true,
          githubUsername: true,
        },
      });

      console.log(`[Scheduler] Scheduling sync for ${users.length} users`);

      // Schedule incremental sync for each user
      for (const user of users) {
        await addJob('githubSync', 'sync-all', {
          userId: user.id,
          syncType: 'all',
          options: {
            incremental: true,
            daysBack: 7, // Sync last 7 days
          },
        });

        console.log(
          `[Scheduler] Scheduled sync for user ${user.githubUsername}`,
        );
      }

      console.log('[Scheduler] Daily sync scheduling completed');
    } catch (error) {
      console.error('[Scheduler] Error scheduling daily sync:', error);
    }
  });
}

/**
 * Schedule daily stats aggregation
 * Runs every day at 3:00 AM (after sync)
 */
export function scheduleDailyAggregation() {
  return cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running daily stats aggregation');

    try {
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      // Aggregate stats for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      for (const user of users) {
        await addJob('dataAggregation', 'aggregate-daily-stats', {
          userId: user.id,
          date: yesterday.toISOString(),
        });
      }

      console.log(
        `[Scheduler] Scheduled aggregation for ${users.length} users`,
      );
    } catch (error) {
      console.error('[Scheduler] Error scheduling aggregation:', error);
    }
  });
}

/**
 * Schedule weekly cleanup
 * Runs every Sunday at 4:00 AM
 */
export function scheduleWeeklyCleanup() {
  return cron.schedule('0 4 * * 0', async () => {
    console.log('[Scheduler] Running weekly cleanup');

    try {
      // Clean old completed jobs
      const { queues } = await import('./config');

      for (const queue of Object.values(queues)) {
        await queue.clean(7 * 24 * 3600 * 1000, 1000, 'completed');
        await queue.clean(30 * 24 * 3600 * 1000, 1000, 'failed');
      }

      // Clean old sync job records
      await prisma.syncJob.deleteMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      console.log('[Scheduler] Weekly cleanup completed');
    } catch (error) {
      console.error('[Scheduler] Error in weekly cleanup:', error);
    }
  });
}

/**
 * Initialize all schedulers
 */
export function initializeSchedulers() {
  console.log('[Scheduler] Initializing cron jobs...');

  const dailySync = scheduleDailySync();
  const dailyAggregation = scheduleDailyAggregation();
  const weeklyCleanup = scheduleWeeklyCleanup();

  console.log('[Scheduler] All cron jobs initialized:');
  console.log('  - Daily Sync: 2:00 AM');
  console.log('  - Daily Aggregation: 3:00 AM');
  console.log('  - Weekly Cleanup: Sunday 4:00 AM');

  return {
    dailySync,
    dailyAggregation,
    weeklyCleanup,
  };
}

/**
 * Stop all schedulers
 */
export function stopSchedulers(
  schedulers: ReturnType<typeof initializeSchedulers>,
) {
  console.log('[Scheduler] Stopping all cron jobs...');

  schedulers.dailySync.stop();
  schedulers.dailyAggregation.stop();
  schedulers.weeklyCleanup.stop();

  console.log('[Scheduler] All cron jobs stopped');
}
