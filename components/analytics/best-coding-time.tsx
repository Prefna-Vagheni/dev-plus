// components/analytics/best-coding-time.tsx - Best Coding Time Analysis
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { format, getDay, getHours } from 'date-fns';

interface ActivityEvent {
  occurredAt: string;
  eventType: string;
  durationSeconds?: number;
}

interface BestCodingTimeProps {
  activities: ActivityEvent[];
}

export function BestCodingTime({ activities }: BestCodingTimeProps) {
  const analysis = useMemo(() => {
    if (!activities || activities.length === 0) {
      return null;
    }

    // Analyze by day of week
    const dayCount: Record<number, number> = {};
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    // Analyze by hour of day
    const hourCount: Record<number, number> = {};

    // Process activities
    (activities || []).forEach((activity) => {
      const date = new Date(activity.occurredAt);
      const day = getDay(date);
      const hour = getHours(date);

      dayCount[day] = (dayCount[day] || 0) + 1;
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });

    // Find most productive day
    const mostProductiveDay = Object.entries(dayCount).reduce(
      (max, [day, count]) =>
        count > max.count ? { day: parseInt(day), count } : max,
      { day: 0, count: 0 },
    );

    // Find most productive hours (top 3)
    const topHours = Object.entries(hourCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        timeRange: `${hour}:00 - ${parseInt(hour) + 1}:00`,
      }));

    // Find least productive day
    const leastProductiveDay = Object.entries(dayCount).reduce(
      (min, [day, count]) =>
        count < min.count ? { day: parseInt(day), count } : min,
      { day: 0, count: Infinity },
    );

    // Calculate consistency (standard deviation of daily activity)
    const dailyCounts = Object.values(dayCount);
    const avgDailyActivity =
      dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
    const variance =
      dailyCounts.reduce(
        (sum, count) => sum + Math.pow(count - avgDailyActivity, 2),
        0,
      ) / dailyCounts.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(
      0,
      100 - (stdDev / avgDailyActivity) * 100,
    );

    return {
      mostProductiveDay: {
        name: dayNames[mostProductiveDay.day],
        count: mostProductiveDay.count,
        percentage: (mostProductiveDay.count / activities.length) * 100,
      },
      leastProductiveDay: {
        name: dayNames[leastProductiveDay.day],
        count: leastProductiveDay.count,
      },
      topHours,
      consistencyScore: Math.round(consistencyScore),
      totalActivities: activities.length,
    };
  }, [activities]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Best Coding Time
          </CardTitle>
          <CardDescription>
            Discover your peak productivity hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Not enough data to analyze coding patterns
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Best Coding Time Analysis
        </CardTitle>
        <CardDescription>
          Discover your peak productivity patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Most Productive Day */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Most Productive Day
            </h4>
            <Badge variant="default">{analysis.mostProductiveDay.name}</Badge>
          </div>
          <p className="text-sm text-gray-600">
            <strong>{analysis.mostProductiveDay.count}</strong> activities (
            {analysis.mostProductiveDay.percentage.toFixed(1)}% of your total)
          </p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${analysis.mostProductiveDay.percentage}%` }}
            />
          </div>
        </div>

        {/* Peak Hours */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4" />
            Peak Productivity Hours
          </h4>
          <div className="space-y-2">
            {analysis.topHours.map((hour, index) => (
              <div
                key={hour.hour}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{hour.timeRange}</div>
                    <div className="text-sm text-gray-600">
                      {hour.count} activities
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {((hour.count / analysis.totalActivities) * 100).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consistency Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Consistency Score</h4>
            <Badge
              variant={
                analysis.consistencyScore > 70
                  ? 'default'
                  : analysis.consistencyScore > 40
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {analysis.consistencyScore}%
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {analysis.consistencyScore > 70
              ? 'Excellent! You maintain consistent coding habits.'
              : analysis.consistencyScore > 40
                ? 'Good consistency. Consider establishing more regular patterns.'
                : 'Your coding schedule varies significantly. Try setting regular times.'}
          </p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                analysis.consistencyScore > 70
                  ? 'bg-green-500'
                  : analysis.consistencyScore > 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${analysis.consistencyScore}%` }}
            />
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Recommendation
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Schedule your most important coding tasks on{' '}
            <strong>{analysis.mostProductiveDay.name}</strong> between{' '}
            <strong>{analysis.topHours[0].timeRange}</strong> when you&apos;re
            most productive!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
