// lib/queue/config.ts - Queue configuration
import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import { redis } from '@/lib/redis';

// const connection = {
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
// };

// Define the connection using the URL if available, otherwise fallback to host/port
const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null, // CRITICAL: BullMQ requires this to be null
    })
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };

export const defaultQueueOptions: QueueOptions = {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

// Queue names
export const QUEUE_NAMES = {
  GITHUB_SYNC: 'github-sync',
  DATA_AGGREGATION: 'data-aggregation',
  SCHEDULED_TASKS: 'scheduled-tasks',
} as const;

// Job types
export const JOB_TYPES = {
  // GitHub sync jobs
  SYNC_REPOSITORIES: 'sync-repositories',
  SYNC_COMMITS: 'sync-commits',
  SYNC_PULL_REQUESTS: 'sync-pull-requests',
  SYNC_ISSUES: 'sync-issues',
  SYNC_ALL: 'sync-all',

  // Aggregation jobs
  AGGREGATE_DAILY_STATS: 'aggregate-daily-stats',
  COMPUTE_USER_STATS: 'compute-user-stats',

  // Scheduled tasks
  DAILY_SYNC: 'daily-sync',
  WEEKLY_CLEANUP: 'weekly-cleanup',
} as const;

// Create queues
export const queues = {
  githubSync: new Queue(QUEUE_NAMES.GITHUB_SYNC, defaultQueueOptions),
  dataAggregation: new Queue(QUEUE_NAMES.DATA_AGGREGATION, defaultQueueOptions),
  scheduledTasks: new Queue(QUEUE_NAMES.SCHEDULED_TASKS, defaultQueueOptions),
};

// Helper to add job to queue with type safety
export async function addJob<T = any>(
  queueName: keyof typeof queues,
  jobType: string,
  data: T,
  options?: any,
) {
  const queue = queues[queueName];
  return queue.add(jobType, data, options);
}

// Helper to get queue metrics
export async function getQueueMetrics(queueName: keyof typeof queues) {
  const queue = queues[queueName];

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

// Clean up old jobs
export async function cleanQueues() {
  for (const queue of Object.values(queues)) {
    await queue.clean(24 * 3600 * 1000, 100, 'completed');
    await queue.clean(7 * 24 * 3600 * 1000, 100, 'failed');
  }
}
