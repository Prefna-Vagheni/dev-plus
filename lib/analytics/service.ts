// lib/analytics/service.ts - Analytics Service
import { prisma } from '@/lib/db';
import { EventType } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export class AnalyticsService {
  constructor(private userId: string) {}

  /**
   * Get overview statistics
   */
  async getOverview(dateRange?: { from: Date; to: Date }) {
    const from = dateRange?.from || subDays(new Date(), 30);
    const to = dateRange?.to || new Date();

    // Get activity events in range
    const events = await prisma.activityEvent.findMany({
      where: {
        userId: this.userId,
        occurredAt: {
          gte: startOfDay(from),
          lte: endOfDay(to),
        },
      },
    });

    // Count by type
    const totalCommits = events.filter(
      (e) => e.eventType === EventType.COMMIT,
    ).length;
    const totalPRs = events.filter(
      (e) => e.eventType === EventType.PULL_REQUEST,
    ).length;
    const totalIssues = events.filter(
      (e) => e.eventType === EventType.ISSUE,
    ).length;
    const totalCodeReviews = events.filter(
      (e) => e.eventType === EventType.CODE_REVIEW,
    ).length;

    // Get coding time from sessions
    const codingSessions = events.filter(
      (e) => e.eventType === EventType.CODE_SESSION,
    );
    const totalCodingSeconds = codingSessions.reduce(
      (sum, session) => sum + (session.durationSeconds || 0),
      0,
    );

    // Get unique repositories
    const repositories = new Set(
      events.map((e) => e.repositoryName).filter(Boolean),
    );

    // Get daily stats for period
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        userId: this.userId,
        statDate: {
          gte: startOfDay(from),
          lte: endOfDay(to),
        },
      },
      orderBy: { statDate: 'asc' },
    });

    // Calculate averages
    const daysInRange = Math.ceil(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );
    const avgCommitsPerDay = totalCommits / daysInRange;
    const avgCodingHoursPerDay = totalCodingSeconds / 3600 / daysInRange;

    // Get most active day
    const activityByDay = dailyStats.reduce(
      (acc, stat) => {
        const dayOfWeek = new Date(stat.statDate).getDay();
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + stat.totalCommits;
        return acc;
      },
      {} as Record<number, number>,
    );

    const mostActiveDay = Object.entries(activityByDay).reduce(
      (max, [day, count]) =>
        count > max.count ? { day: parseInt(day), count } : max,
      { day: 0, count: 0 },
    );

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    return {
      totals: {
        commits: totalCommits,
        pullRequests: totalPRs,
        issues: totalIssues,
        codeReviews: totalCodeReviews,
        codingHours: totalCodingSeconds / 3600,
        activeRepositories: repositories.size,
      },
      averages: {
        commitsPerDay: avgCommitsPerDay,
        codingHoursPerDay: avgCodingHoursPerDay,
      },
      insights: {
        mostActiveDay: dayNames[mostActiveDay.day],
        totalDays: daysInRange,
        daysWithActivity: dailyStats.length,
      },
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    };
  }

  /**
   * Get activity trends over time
   */
  async getTrends(dateRange?: { from: Date; to: Date }) {
    const from = dateRange?.from || subDays(new Date(), 30);
    const to = dateRange?.to || new Date();

    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        userId: this.userId,
        statDate: {
          gte: startOfDay(from),
          lte: endOfDay(to),
        },
      },
      orderBy: { statDate: 'asc' },
    });

    // Fill in missing dates with zeros
    const trends = [];
    const currentDate = new Date(from);

    while (currentDate <= to) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const stat = dailyStats.find(
        (s) => format(new Date(s.statDate), 'yyyy-MM-dd') === dateStr,
      );

      trends.push({
        date: dateStr,
        commits: stat?.totalCommits || 0,
        pullRequests: stat?.totalPullRequests || 0,
        issues: stat?.totalIssues || 0,
        codingHours: stat ? stat.codingTimeSeconds / 3600 : 0,
        linesAdded: stat?.linesAdded || 0,
        linesDeleted: stat?.linesDeleted || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trends;
  }

  /**
   * Get language breakdown
   */
  async getLanguageBreakdown(dateRange?: { from: Date; to: Date }) {
    const from = dateRange?.from || subDays(new Date(), 30);
    const to = dateRange?.to || new Date();

    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        userId: this.userId,
        statDate: {
          gte: startOfDay(from),
          lte: endOfDay(to),
        },
      },
    });

    // Aggregate language usage
    const languageMap = new Map<string, number>();

    dailyStats.forEach((stat) => {
      const languages = stat.languages as Record<string, number>;
      Object.entries(languages).forEach(([lang, count]) => {
        languageMap.set(lang, (languageMap.get(lang) || 0) + count);
      });
    });

    // Convert to array and sort by count
    const languages = Array.from(languageMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Calculate percentages
    const total = languages.reduce((sum, lang) => sum + lang.value, 0);
    const languagesWithPercentage = languages.map((lang) => ({
      ...lang,
      percentage: total > 0 ? (lang.value / total) * 100 : 0,
    }));

    return {
      languages: languagesWithPercentage,
      total,
    };
  }

  /**
   * Get repository activity
   */
  async getRepositoryActivity(dateRange?: { from: Date; to: Date }) {
    const from = dateRange?.from || subDays(new Date(), 30);
    const to = dateRange?.to || new Date();

    const events = await prisma.activityEvent.findMany({
      where: {
        userId: this.userId,
        occurredAt: {
          gte: startOfDay(from),
          lte: endOfDay(to),
        },
        repositoryName: {
          not: null,
        },
      },
    });

    // Group by repository
    const repoMap = new Map<
      string,
      {
        commits: number;
        pullRequests: number;
        issues: number;
        lastActivity: Date;
      }
    >();

    events.forEach((event) => {
      if (!event.repositoryName) return;

      const repo = repoMap.get(event.repositoryName) || {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        lastActivity: event.occurredAt,
      };

      if (event.eventType === EventType.COMMIT) repo.commits++;
      if (event.eventType === EventType.PULL_REQUEST) repo.pullRequests++;
      if (event.eventType === EventType.ISSUE) repo.issues++;

      if (event.occurredAt > repo.lastActivity) {
        repo.lastActivity = event.occurredAt;
      }

      repoMap.set(event.repositoryName, repo);
    });

    // Convert to array and sort by total activity
    const repositories = Array.from(repoMap.entries())
      .map(([name, stats]) => ({
        name,
        ...stats,
        totalActivity: stats.commits + stats.pullRequests + stats.issues,
      }))
      .sort((a, b) => b.totalActivity - a.totalActivity);

    return repositories;
  }

  /**
   * Get activity timeline (for timeline component)
   */
  async getActivityTimeline(limit: number = 50) {
    const events = await prisma.activityEvent.findMany({
      where: { userId: this.userId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    return events.map((event) => ({
      id: event.id,
      type: event.eventType,
      source: event.source,
      repositoryName: event.repositoryName,
      language: event.language,
      data: event.eventData,
      occurredAt: event.occurredAt.toISOString(),
    }));
  }

  /**
   * Get productivity metrics
   */
  async getProductivityMetrics(dateRange?: { from: Date; to: Date }) {
    const from = dateRange?.from || subDays(new Date(), 30);
    const to = dateRange?.to || new Date();

    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        userId: this.userId,
        statDate: {
          gte: startOfDay(from),
          lte: endOfDay(to),
        },
      },
      orderBy: { statDate: 'asc' },
    });

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedDates = dailyStats
      .map((s) => new Date(s.statDate))
      .sort((a, b) => b.getTime() - a.getTime());

    sortedDates.forEach((date, index) => {
      if (index === 0) {
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const prevDate = sortedDates[index - 1];
        const dayDiff = Math.floor(
          (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dayDiff === 1) {
          tempStreak++;
          if (index === sortedDates.length - 1 || tempStreak > currentStreak) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    });

    // Get best day
    const bestDay = dailyStats.reduce(
      (max, stat) => {
        const total =
          stat.totalCommits + stat.totalPullRequests + stat.totalIssues;
        return total > max.total ? { date: stat.statDate, total } : max;
      },
      { date: new Date(), total: 0 },
    );

    return {
      currentStreak,
      longestStreak,
      bestDay: {
        date: bestDay.date.toISOString(),
        activities: bestDay.total,
      },
      totalActiveDays: dailyStats.length,
    };
  }
}

/**
 * Create analytics service for a user
 */
export function createAnalyticsService(userId: string) {
  return new AnalyticsService(userId);
}
