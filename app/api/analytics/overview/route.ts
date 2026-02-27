import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createAnalyticsService } from '@/lib/analytics/service';
import { withRateLimit, RateLimits } from '@/lib/middleware/rate-limit';
import { createCachedAnalyticsService } from '@/lib/analytics/cached-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const rateLimitResponse = await withRateLimit(
      request,
      RateLimits.API_ANALYTICS,
      session.user.id,
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const analytics = createCachedAnalyticsService(session.user.id);

    const dateRange =
      from && to
        ? {
            from: new Date(from),
            to: new Date(to),
          }
        : undefined;

    const overview = await analytics.getOverview(dateRange);

    // Add cache headers
    const response = NextResponse.json(overview);
    response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes

    return response;
  } catch (error) {
    console.error('[API] Error fetching overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 },
    );
  }
}
