// import { NextResponse } from 'next/server';
// import { getSession } from '@/lib/auth-utils';
// import { createAnalyticsService } from '@/lib/analytics/service';

// export async function GET(request: Request) {
//   try {
//     const session = await getSession();
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const limit = parseInt(searchParams.get('limit') || '50');

//     const analytics = createAnalyticsService(session.user.id);
//     const timeline = await analytics.getActivityTimeline(limit);

//     return NextResponse.json({ timeline });
//   } catch (error) {
//     console.error('[API] Error fetching timeline:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch timeline' },
//       { status: 500 },
//     );
//   }
// }

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

    // Rate limiting
    const rateLimitResponse = await withRateLimit(
      request,
      RateLimits.API_ANALYTICS,
      session.user.id,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const analytics = createCachedAnalyticsService(session.user.id);

    const data = await analytics.getActivityTimeline(limit);

    const timeline = Array.isArray(data) ? data : [];

    const response = NextResponse.json({ timeline });
    response.headers.set('Cache-Control', 'private, max-age=300');

    return response;
  } catch (error) {
    console.error('[API] Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline', timeline: [] },
      { status: 500 },
    );
  }
}
