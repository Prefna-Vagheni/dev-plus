import { describe, test, expect, jest } from '@jest/globals';
import { createAnalyticsService } from '@/lib/analytics/service';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    dailyStat: {
      findMany: jest.fn(),
    },
    activityEvent: {
      findMany: jest.fn(),
    },
  },
}));

describe('AnalyticsService', () => {
  test('getOverview returns correct totals', async () => {
    prisma.dailyStat.findMany.mockResolvedValue([
      { totalCommits: 50 },
      { totalCommits: 50 },
    ]);

    const analytics = createAnalyticsService('user-123');
    const overview = await analytics.getOverview();

    expect(overview.totals.commits).toBe(100);
  });

  test('handles date range filtering', async () => {
    const analytics = createAnalyticsService('user-123');

    const dateRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    };

    await analytics.getOverview(dateRange);

    // Verify date range was used
    expect(/* check query was called with date range */).toBeTruthy();
  });
});
