import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const keys = await redis.keys('user:*');

    const stats = {
      totalKeys: keys.length,
      keysByType: {
        overview: keys.filter((k) => k.includes(':overview')).length,
        trends: keys.filter((k) => k.includes(':trends')).length,
        languages: keys.filter((k) => k.includes(':languages')).length,
        timeline: keys.filter((k) => k.includes(':timeline')).length,
      },
      memory: await redis.info('memory'),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.log('Failed to log' + error);
    return NextResponse.json(
      { error: 'Failed to fetch cache stats' },
      { status: 500 },
    );
  }
}
