// app/api/export/route.ts - Export Data API
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { createAnalyticsService } from '@/lib/analytics/service';
import { withRateLimit } from '@/lib/middleware/rate-limit';

// Helper to convert to CSV
function jsonToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values with commas, quotes, newlines
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(','),
    ),
  ];

  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResponse = await withRateLimit(
      request,
      { max: 10, window: 300 }, // 10 exports per 5 minutes
      session.user.id,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview'; // overview, activities, repositories, dailyStats
    const format = searchParams.get('format') || 'json'; // json or csv
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const dateRange =
      from && to
        ? {
            from: new Date(from),
            to: new Date(to),
          }
        : undefined;

    let data: any;
    let filename: string;

    switch (type) {
      case 'overview':
        const analytics = createAnalyticsService(session.user.id);
        data = await analytics.getOverview(dateRange);
        filename = `analytics-overview-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'activities':
        const activities = await prisma.activityEvent.findMany({
          where: {
            userId: session.user.id,
            ...(dateRange && {
              occurredAt: {
                gte: dateRange.from,
                lte: dateRange.to,
              },
            }),
          },
          orderBy: { occurredAt: 'desc' },
          take: 10000, // Limit to 10k records
        });
        data = activities.map((a) => ({
          id: a.id,
          type: a.eventType,
          repository: a.repositoryName,
          language: a.language,
          date: a.occurredAt.toISOString(),
          durationMinutes: a.durationSeconds
            ? Math.round(a.durationSeconds / 60)
            : 0,
        }));
        filename = `activities-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'repositories':
        const repositories = await prisma.repository.findMany({
          where: { userId: session.user.id },
        });
        data = repositories.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stars,
          forks: r.forks,
          isPrivate: r.isPrivate,
          url: (r as any).url,
          createdAt: r.createdAt.toISOString(),
        }));
        filename = `repositories-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'dailyStats':
        const stats = await prisma.dailyStats.findMany({
          where: {
            userId: session.user.id,
            ...(dateRange && {
              statDate: {
                gte: dateRange.from,
                lte: dateRange.to,
              },
            }),
          },
          orderBy: { statDate: 'desc' },
        });
        data = stats.map((s) => ({
          date: s.statDate.toISOString().split('T')[0],
          commits: s.totalCommits,
          pullRequests: s.totalPullRequests,
          issues: s.totalIssues,
          codingHours: Math.round((s.codingTimeSeconds / 3600) * 10) / 10,
          linesAdded: s.linesAdded,
          linesDeleted: s.linesDeleted,
          activeRepositories: Array.isArray(s.activeRepositories)
            ? s.activeRepositories.length
            : 0,
        }));
        filename = `daily-stats-${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 },
        );
    }

    // Format response
    if (format === 'csv') {
      const csv = jsonToCSV(Array.isArray(data) ? data : [data]);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // JSON format
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('[Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 },
    );
  }
}
