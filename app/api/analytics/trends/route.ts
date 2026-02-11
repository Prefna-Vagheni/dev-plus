import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createAnalyticsService } from '@/lib/analytics/service';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const analytics = createAnalyticsService(session.user.id);

    const dateRange =
      from && to
        ? {
            from: new Date(from),
            to: new Date(to),
          }
        : undefined;

    const trends = await analytics.getTrends(dateRange);

    return NextResponse.json({ trends });
  } catch (error) {
    console.error('[API] Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 },
    );
  }
}
