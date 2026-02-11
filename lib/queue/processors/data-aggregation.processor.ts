// lib/queue/processors/data-aggregation.processor.ts - Data aggregation processor
import { Job } from 'bullmq';
import { prisma } from '@/lib/db';
import { EventType } from '@prisma/client';

interface AggregationJobData {
  userId: string;
  date?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export async function processDataAggregationJob(job: Job<AggregationJobData>) {
  const { userId, date, dateRange } = job.data;

  console.log(`[Data Aggregation] Processing for user ${userId}`);

  try {
    if (date) {
      // Aggregate for specific date
      await aggregateDailyStats(userId, new Date(date));
    } else if (dateRange) {
      // Aggregate for date range
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      const dates = getDateRange(from, to);

      for (let i = 0; i < dates.length; i++) {
        await aggregateDailyStats(userId, dates[i]);
        await job.updateProgress(((i + 1) / dates.length) * 100);
      }
    } else {
      // Aggregate last 30 days by default
      const dates = getDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(),
      );

      for (let i = 0; i < dates.length; i++) {
        await aggregateDailyStats(userId, dates[i]);
        await job.updateProgress(((i + 1) / dates.length) * 100);
      }
    }

    return {
      success: true,
      userId,
      aggregatedDays: dateRange
        ? getDateRange(new Date(dateRange.from), new Date(dateRange.to)).length
        : 1,
    };
  } catch (error) {
    console.error('[Data Aggregation] Error:', error);
    throw error;
  }
}

/**
 * Aggregate stats for a specific day
 */
async function aggregateDailyStats(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all events for the day
  const events = await prisma.activityEvent.findMany({
    where: {
      userId,
      occurredAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Calculate stats
  const commits = events.filter((e) => e.eventType === EventType.COMMIT);
  const pullRequests = events.filter(
    (e) => e.eventType === EventType.PULL_REQUEST,
  );
  const issues = events.filter((e) => e.eventType === EventType.ISSUE);
  const codeReviews = events.filter(
    (e) => e.eventType === EventType.CODE_REVIEW,
  );
  const codingSessions = events.filter(
    (e) => e.eventType === EventType.CODE_SESSION,
  );

  // Aggregate language usage
  const languageMap = new Map<string, number>();
  events.forEach((event) => {
    if (event.language) {
      languageMap.set(
        event.language,
        (languageMap.get(event.language) || 0) + 1,
      );
    }
  });

  const languages = Object.fromEntries(languageMap);

  // Aggregate repository activity
  const repositorySet = new Set<string>();
  events.forEach((event) => {
    if (event.repositoryName) {
      repositorySet.add(event.repositoryName);
    }
  });

  const activeRepositories = Array.from(repositorySet);

  // Calculate lines of code (from commit data)
  let linesAdded = 0;
  let linesDeleted = 0;

  commits.forEach((commit) => {
    // eslint-disable-next-line
    const data = commit.eventData as any;
    if (data.additions) linesAdded += data.additions;
    if (data.deletions) linesDeleted += data.deletions;
  });

  // Calculate coding time
  const codingTimeSeconds = codingSessions.reduce(
    (total, session) => total + (session.durationSeconds || 0),
    0,
  );

  // Upsert daily stats
  await prisma.dailyStats.upsert({
    where: {
      userId_statDate: {
        userId,
        statDate: startOfDay,
      },
    },
    create: {
      userId,
      statDate: startOfDay,
      totalCommits: commits.length,
      totalPullRequests: pullRequests.length,
      totalIssues: issues.length,
      totalCodeReviews: codeReviews.length,
      codingTimeSeconds,
      languages,
      activeRepositories,
      linesAdded,
      linesDeleted,
    },
    update: {
      totalCommits: commits.length,
      totalPullRequests: pullRequests.length,
      totalIssues: issues.length,
      totalCodeReviews: codeReviews.length,
      codingTimeSeconds,
      languages,
      activeRepositories,
      linesAdded,
      linesDeleted,
      updatedAt: new Date(),
    },
  });

  console.log(
    `[Data Aggregation] Aggregated ${events.length} events for ${userId} on ${startOfDay.toISOString()}`,
  );
}

/**
 * Generate array of dates between two dates
 */
function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
