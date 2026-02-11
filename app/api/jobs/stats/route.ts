// app/api/jobs/stats/route.ts - Job monitoring API
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { getQueueMetrics, queues } from '@/lib/queue/config';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get metrics for all queues
    const [githubSyncMetrics, dataAggregationMetrics] = await Promise.all([
      getQueueMetrics('githubSync'),
      getQueueMetrics('dataAggregation'),
    ]);

    // Get recent jobs
    const githubSyncJobs = await queues.githubSync.getJobs(
      ['active', 'waiting', 'completed', 'failed'],
      0,
      10,
    );

    const aggregationJobs = await queues.dataAggregation.getJobs(
      ['active', 'waiting', 'completed', 'failed'],
      0,
      10,
    );

    return NextResponse.json({
      queues: {
        githubSync: {
          metrics: githubSyncMetrics,
          recentJobs: await Promise.all(
            githubSyncJobs.map(async (job) => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress:
                (await job.getState()) === 'active' ? job.progress : null,
              state: await job.getState(),
              timestamp: job.timestamp,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
            })),
          ),
        },
        dataAggregation: {
          metrics: dataAggregationMetrics,
          recentJobs: await Promise.all(
            aggregationJobs.map(async (job) => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress:
                (await job.getState()) === 'active' ? job.progress : null,
              state: await job.getState(),
              timestamp: job.timestamp,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
            })),
          ),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error fetching job stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch job statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
