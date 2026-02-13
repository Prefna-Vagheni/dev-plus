import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createAIService, InsightType } from '@/lib/ai/service';
import { withRateLimit } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting (10 requests per 5 minutes)
    const rateLimitResponse = await withRateLimit(
      request,
      { max: 10, window: 300 },
      session.user.id,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { type, query, forceRefresh } = body as {
      type: InsightType;
      query?: string;
      forceRefresh?: boolean;
    };

    if (!type) {
      return NextResponse.json(
        { error: 'Insight type is required' },
        { status: 400 },
      );
    }

    const aiService = createAIService(session.user.id);
    const insight = await aiService.generateInsight(type, {
      query,
      forceRefresh,
    });

    return NextResponse.json({
      success: true,
      insight,
      type,
    });
  } catch (error) {
    console.error('[API] Error generating insight:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insight',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const aiService = createAIService(session.user.id);
    const insights = await aiService.getRecentInsights(10);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('[API] Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 },
    );
  }
}
