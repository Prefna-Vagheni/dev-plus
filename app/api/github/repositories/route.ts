// app/api/github/repositories/route.ts - Repositories API Route
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const language = searchParams.get('language');

    const where = {
      userId: session.user.id,
      ...(language && { language }),
    };

    const [repositories, total] = await Promise.all([
      prisma.repository.findMany({
        where,
        orderBy: { lastActivityAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.repository.count({ where }),
    ]);

    return NextResponse.json({
      repositories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 },
    );
  }
}
