import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // 1. Remove 'any'. Define the object directly so Prisma can infer types.
    const where = {
      userId: session.user.id,
      ...(from && to
        ? {
            statDate: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {}),
    };

    const stats = await prisma.dailyStats.findMany({
      where,
      orderBy: { statDate: 'asc' },
      select: {
        statDate: true,
        totalCommits: true,
        totalPullRequests: true,
        totalIssues: true,
        codingTimeSeconds: true,
      },
    });

    return NextResponse.json({
      // 2. No manual interface needed. 's' is now automatically typed
      // by Prisma because we removed the 'any' from the 'where' clause.
      stats: stats.map((s) => ({
        date: s.statDate.toISOString(),
        totalCommits: s.totalCommits,
        totalPullRequests: s.totalPullRequests,
        totalIssues: s.totalIssues,
        codingTimeSeconds: s.codingTimeSeconds,
      })),
    });
  } catch (error) {
    console.error('[API] Error fetching daily stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 },
    );
  }
}
