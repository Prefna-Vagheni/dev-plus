// app/api/github/sync/route.ts - GitHub Sync API Route
/*
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createGitHubService } from '@/lib/github/service';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const { syncType = 'all', since } = body;

    console.log(
      `[API] Starting GitHub sync for user ${userId}, type: ${syncType}`,
    );

    // Create GitHub service
    const githubService = await createGitHubService(userId);

    // Perform sync based on type
    let results;
    switch (syncType) {
      case 'repositories':
        results = await githubService.syncRepositories();
        break;
      case 'commits':
        results = await githubService.syncCommits(
          since ? new Date(since) : undefined,
        );
        break;
      case 'pullRequests':
        results = await githubService.syncPullRequests(
          since ? new Date(since) : undefined,
        );
        break;
      case 'issues':
        results = await githubService.syncIssues(
          since ? new Date(since) : undefined,
        );
        break;
      case 'all':
      default:
        results = await githubService.syncAll(
          since ? new Date(since) : undefined,
        );
        break;
    }

    // Update user's last sync time
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      syncType,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] GitHub sync error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Create GitHub service and get sync stats
    const githubService = await createGitHubService(userId);
    const stats = await githubService.getSyncStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[API] Error fetching sync stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sync stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
*/

// app/api/github/sync/route.ts - Updated to use job queue
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { addJob } from '@/lib/queue/config';
import { JOB_TYPES } from '@/lib/queue/config';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const { syncType = 'all', since, incremental = false } = body;

    console.log(
      `[API] Scheduling GitHub sync for user ${userId}, type: ${syncType}`,
    );

    // Add job to queue instead of processing synchronously
    const job = await addJob('githubSync', JOB_TYPES.SYNC_ALL, {
      // userId,
      userId: session.user.id,
      // syncType,
      syncType: body.syncType || 'all',
      since,
      options: {
        incremental,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sync started in background',
      jobId: job.id,
      syncType,
      status: 'queued',
    });
  } catch (error) {
    console.error('[API] Error scheduling sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to schedule sync',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get sync job history
    const { prisma } = await import('@/lib/db');

    const recentJobs = await prisma.syncJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      jobs: recentJobs,
    });
  } catch (error) {
    console.error('[API] Error fetching sync jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sync jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
