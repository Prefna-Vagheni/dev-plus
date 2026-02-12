// lib/queue/processors/github-sync.processor.ts - GitHub sync job processor
import { Job } from 'bullmq';
import { createGitHubService } from '@/lib/github/service';
import { prisma } from '@/lib/db';
import { addJob, JOB_TYPES } from '../config';
import { emitToUser } from '@/lib/websocket/server';
import { CacheInvalidation } from '@/lib/cache/invalidation';

interface GitHubSyncJobData {
  userId: string;
  syncType: 'all' | 'repositories' | 'commits' | 'pullRequests' | 'issues';
  since?: string;
  options?: {
    incremental?: boolean;
    daysBack?: number;
  };
}

export async function processGitHubSyncJob(job: Job<GitHubSyncJobData>) {
  const { userId, syncType, since, options } = job.data;

  console.log(`[GitHub Sync Job] Processing ${syncType} for user ${userId}`);

  // Update job progress
  await job.updateProgress(10);

  try {
    // Create GitHub service
    const githubService = await createGitHubService(userId);

    // Determine sync date range
    let sinceDate: Date | undefined;

    if (since) {
      sinceDate = new Date(since);
    } else if (options?.incremental) {
      // Get last sync time from user's latest activity
      const lastActivity = await prisma.activityEvent.findFirst({
        where: { userId },
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true },
      });

      sinceDate =
        lastActivity?.occurredAt ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (options?.daysBack) {
      sinceDate = new Date(Date.now() - options.daysBack * 24 * 60 * 60 * 1000);
    }

    await job.updateProgress(20);

    let result;

    // Execute sync based on type
    switch (syncType) {
      case 'repositories':
        result = await githubService.syncRepositories();
        // await job.updateProgress(100);
        await CacheInvalidation.invalidateByEventType(userId, 'REPOSITORY');
        break;

      case 'commits':
        result = await githubService.syncCommits(sinceDate);
        // await job.updateProgress(100);
        await CacheInvalidation.invalidateByEventType(userId, 'COMMIT');
        break;

      case 'pullRequests':
        result = await githubService.syncPullRequests(sinceDate);
        // await job.updateProgress(100);
        await CacheInvalidation.invalidateByEventType(userId, 'PULL_REQUEST');
        break;

      case 'issues':
        result = await githubService.syncIssues(sinceDate);
        // await job.updateProgress(100);
        await CacheInvalidation.invalidateByEventType(userId, 'ISSUE');
        break;

      case 'all':
      default:
        // Progress tracking for full sync
        result = {
          repositories: [],
          commits: {},
          pullRequests: {},
          issues: {},
        };

        result.repositories = await githubService.syncRepositories();
        await job.updateProgress(40);

        result.commits = await githubService.syncCommits(sinceDate);
        await job.updateProgress(60);

        result.pullRequests = await githubService.syncPullRequests(sinceDate);
        await job.updateProgress(80);

        result.issues = await githubService.syncIssues(sinceDate);
        await job.updateProgress(100);

        // Invalidate all caches after full sync
        await CacheInvalidation.invalidateAfterSync(userId);
        break;
    }

    await job.updateProgress(95);

    // Update user's last sync timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });

    // Schedule cache warming
    await addJob('dataAggregation', 'warm-cache', {
      userId,
    });

    await job.updateProgress(100);

    // Emit WebSocket event
    emitToUser(userId, 'sync:complete', {
      syncType,
      itemsProcessed:
        typeof result === 'object' && 'synced' in result
          ? result.synced
          : Array.isArray(result)
            ? result.length
            : 0,
      timestamp: new Date().toISOString(),
    });

    // Create sync job record
    await prisma.syncJob.create({
      data: {
        userId,
        jobType: `github-${syncType}`,
        status: 'COMPLETED',
        startedAt: new Date(job.timestamp),
        completedAt: new Date(),
        itemsProcessed:
          typeof result === 'object' && 'synced' in result
            ? result.synced
            : Array.isArray(result)
              ? result.length
              : 0,
        metadata: {
          syncType,
          sinceDate: sinceDate?.toISOString(),
          incremental: options?.incremental,
        },
      },
    });

    console.log(
      `[GitHub Sync Job] Completed ${syncType} for user ${userId}`,
      result,
    );

    return {
      success: true,
      syncType,
      userId,
      result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[GitHub Sync Job] Error processing ${syncType}:`, error);

    // Record failed job
    await prisma.syncJob.create({
      data: {
        userId,
        jobType: `github-${syncType}`,
        status: 'FAILED',
        startedAt: new Date(job.timestamp),
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          syncType,
          error: error instanceof Error ? error.stack : String(error),
        },
      },
    });

    throw error;
  }
}
