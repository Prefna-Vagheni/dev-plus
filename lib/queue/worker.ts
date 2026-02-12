// lib/queue/worker.ts - Background job worker
import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES, defaultQueueOptions } from './config';
import { processGitHubSyncJob } from './processors/github-sync.processor';
import { processDataAggregationJob } from './processors/data-aggregation.processor';
import { processCacheWarmingJob } from './processors/cache-warming.processor';

// GitHub Sync Worker
export const githubSyncWorker = new Worker(
  QUEUE_NAMES.GITHUB_SYNC,
  async (job: Job) => {
    console.log(`[Worker] Processing job ${job.id} of type ${job.name}`);
    return processGitHubSyncJob(job);
  },
  {
    ...defaultQueueOptions,
    concurrency: 5, // Process up to 5 jobs concurrently
  },
);

// Data Aggregation Worker
export const dataAggregationWorker = new Worker(
  QUEUE_NAMES.DATA_AGGREGATION,
  async (job: Job) => {
    console.log(`[Worker] Processing aggregation job ${job.id}`);
    return processDataAggregationJob(job);
  },
  {
    ...defaultQueueOptions,
    concurrency: 3,
  },
);

// Add Cache Warming Worker
export const cacheWarmingWorker = new Worker(
  QUEUE_NAMES.DATA_AGGREGATION,
  async (job: Job) => {
    if (job.name === 'warm-cache') {
      console.log(`[Worker] Processing cache warming job ${job.id}`);
      return processCacheWarmingJob(job);
    }

    // Existing aggregation logic
    return processDataAggregationJob(job);
  },
  {
    ...defaultQueueOptions,
    concurrency: 3,
  },
);

// Event handlers
cacheWarmingWorker.on('completed', (job, result) => {
  console.log(`[Worker] Cache warming completed:`, result);
});

cacheWarmingWorker.on('failed', (job, error) => {
  console.error(`[Worker] Cache warming failed:`, error);
});

// Event handlers for GitHub Sync Worker
githubSyncWorker.on('completed', (job, result) => {
  console.log(`[Worker] Job ${job.id} completed successfully`, result);
});

githubSyncWorker.on('failed', (job, error) => {
  console.error(`[Worker] Job ${job?.id} failed:`, error);
});

githubSyncWorker.on('error', (error) => {
  console.error('[Worker] GitHub Sync Worker error:', error);
});

// Event handlers for Data Aggregation Worker
dataAggregationWorker.on('completed', (job, result) => {
  console.log(`[Worker] Aggregation job ${job.id} completed`, result);
});

dataAggregationWorker.on('failed', (job, error) => {
  console.error(`[Worker] Aggregation job ${job?.id} failed:`, error);
});

dataAggregationWorker.on('error', (error) => {
  console.error('[Worker] Data Aggregation Worker error:', error);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('[Worker] Shutting down gracefully...');

  await Promise.all([githubSyncWorker.close(), dataAggregationWorker.close()]);

  console.log('[Worker] All workers closed');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('[Worker] Background workers started');
console.log('  - GitHub Sync Worker (concurrency: 5)');
console.log('  - Data Aggregation Worker (concurrency: 3)');
