import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createAnalyticsService } from '@/lib/analytics/service';
import { RateLimits, withRateLimit } from '@/lib/middleware/rate-limit';
import { createCachedAnalyticsService } from '@/lib/analytics/cached-service';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(
      request,
      RateLimits.API_ANALYTICS,
      session.user.id,
    );

    if (rateLimitResponse) return rateLimitResponse;

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

    const languages = await analytics.getLanguageBreakdown(dateRange);

    const response = NextResponse.json(languages);
    response.headers.set('Cache-Control', 'private, max-age=3600'); // 1 hour

    return response;
  } catch (error) {
    console.error('[API] Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch language breakdown' },
      { status: 500 },
    );
  }
}
