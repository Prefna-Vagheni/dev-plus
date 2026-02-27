// lib/graphql/resolvers.ts - GraphQL Resolvers
import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/db';
import { createAnalyticsService } from '@/lib/analytics/service';
import { createAIService } from '@/lib/ai/service';
import { addJob } from '@/lib/queue/config';
import { RedisCache } from '@/lib/cache/redis-cache';
import { GraphQLScalarType, Kind } from 'graphql';
import { subscriptionResolvers } from './subscriptions';

// Custom scalar for DateTime
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Custom scalar for JSON
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return ast;
    }
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    // Current user
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },

    // Analytics Overview
    analyticsOverview: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const analytics = createAnalyticsService(context.user.id);

      const dateRange = args.dateRange
        ? {
            from: new Date(args.dateRange.from),
            to: new Date(args.dateRange.to),
          }
        : undefined;

      return analytics.getOverview(dateRange);
    },

    // Productivity Trends
    productivityTrends: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const analytics = createAnalyticsService(context.user.id);

      const dateRange = args.dateRange
        ? {
            from: new Date(args.dateRange.from),
            to: new Date(args.dateRange.to),
          }
        : undefined;

      const trends = await analytics.getTrends(dateRange);

      return trends;
    },

    // Language Breakdown
    languageBreakdown: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const analytics = createAnalyticsService(context.user.id);

      const dateRange = args.dateRange
        ? {
            from: new Date(args.dateRange.from),
            to: new Date(args.dateRange.to),
          }
        : undefined;

      return analytics.getLanguageBreakdown(dateRange);
    },

    // Repository Activity
    repositoryActivity: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const analytics = createAnalyticsService(context.user.id);

      const dateRange = args.dateRange
        ? {
            from: new Date(args.dateRange.from),
            to: new Date(args.dateRange.to),
          }
        : undefined;

      return analytics.getRepositoryActivity(dateRange);
    },

    // Repositories
    repositories: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const repos = await prisma.repository.findMany({
        where: { userId: context.user.id },
        // take: args.limit || 10,
        // skip: args.offset || 0,
        orderBy: { lastActivityAt: 'desc' },
      });

      if (repos.length === 0) return [];

      // OPTIMIZED: Get all stats for all repos in ONE query instead of many
      //   const allStats = await prisma.activityEvent.groupBy({
      //     by: ['repositoryName', 'eventType'],
      //     where: {
      //       userId: context.user.id,
      //       repositoryName: { in: repos.map((r) => r.name) },
      //     },
      //     _count: { eventType: true },
      //   });

      return Promise.all(
        repos.map(async (repo) => {
          const repoStats = await prisma.activityEvent.groupBy({
            by: ['eventType'],
            where: {
              userId: context.user.id,
              repositoryName: repo.name,
            },
            _count: {
              eventType: true,
            },
          });

          return {
            ...repo,
            // FIX: Use fullName to construct the URL or simply remove if not in schema
            url: `https://github.com/${repo.fullName}`,
            totalCommits:
              repoStats.find((s) => s.eventType === 'COMMIT')?._count
                .eventType || 0,
            totalPRs:
              repoStats.find((s) => s.eventType === 'PULL_REQUEST')?._count
                .eventType || 0,
            totalIssues:
              repoStats.find((s) => s.eventType === 'ISSUE')?._count
                .eventType || 0,
          };
        }),
      );
    },

    // Repository by ID
    repository: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const repo = await prisma.repository.findFirst({
        where: {
          id: args.id,
          userId: context.user.id,
        },
      });

      if (!repo) return null;

      // Get aggregated stats
      const stats = await prisma.activityEvent.groupBy({
        by: ['eventType'],
        where: {
          userId: context.user.id,
          repositoryName: repo.name,
        },
        _count: { eventType: true },
      });

      const totalCommits =
        stats.find((s) => s.eventType === 'COMMIT')?._count.eventType || 0;
      const totalPullRequests =
        stats.find((s) => s.eventType === 'PULL_REQUEST')?._count.eventType ||
        0;
      const totalIssues =
        stats.find((s) => s.eventType === 'ISSUE')?._count.eventType || 0;

      return {
        ...repo,
        totalCommits,
        totalPullRequests,
        totalIssues,
      };
    },

    // Activity Timeline
    activityTimeline: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.activityEvent.findMany({
        where: { userId: context.user.id },
        take: args.limit || 50,
        skip: args.offset || 0,
        orderBy: { occurredAt: 'desc' },
      });
    },

    // Daily Stats
    dailyStats: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const where: any = { userId: context.user.id };

      if (args.dateRange) {
        where.statDate = {
          gte: new Date(args.dateRange.from),
          lte: new Date(args.dateRange.to),
        };
      }

      return prisma.dailyStats.findMany({
        where,
        orderBy: { statDate: 'asc' },
      });
    },

    // AI Insights
    // eslint-disable-next-line
    aiInsights: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.aIInsight.findMany({
        where: {
          userId: context.user.id,
          expiresAt: { gte: new Date() },
        },
        take: args.limit || 10,
        orderBy: { createdAt: 'desc' },
      });
    },

    // Single AI Insight
    aiInsight: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.aIInsight.findFirst({
        where: {
          id: args.id,
          userId: context.user.id,
        },
      });
    },

    // Sync Jobs
    syncJobs: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.syncJob.findMany({
        where: { userId: context.user.id },
        take: args.limit || 20,
        orderBy: { startedAt: 'desc' },
      });
    },

    // Most Recent Sync Job
    recentSyncJob: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.syncJob.findFirst({
        where: { userId: context.user.id },
        orderBy: { startedAt: 'desc' },
      });
    },
  },

  Mutation: {
    // Trigger GitHub Sync
    triggerSync: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { syncType, incremental } = args.input;

      // Map GraphQL enum to job type
      const jobTypeMap: Record<string, string> = {
        REPOSITORIES: 'repositories',
        COMMITS: 'commits',
        PULL_REQUESTS: 'pullRequests',
        ISSUES: 'issues',
        ALL: 'all',
      };

      const jobType = jobTypeMap[syncType] || 'all';

      // Add job to queue
      await addJob('githubSync', jobType, {
        userId: context.user.id,
        syncType: jobType,
        options: { incremental },
      });

      // Create sync job record
      const syncJob = await prisma.syncJob.create({
        data: {
          userId: context.user.id,
          jobType: `github-${jobType}`,
          status: 'PENDING',
          startedAt: new Date(),
        },
      });

      return syncJob;
    },

    // Generate AI Insight
    generateInsight: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { type, query, forceRefresh } = args.input;

      // Map GraphQL enum to service type
      const typeMap: Record<string, string> = {
        WEEKLY_SUMMARY: 'weekly-summary',
        PRODUCTIVITY_ANALYSIS: 'productivity-analysis',
        LANGUAGE_RECOMMENDATIONS: 'language-recommendations',
        CODE_PATTERNS: 'code-patterns',
        ACHIEVEMENTS: 'achievements',
        NATURAL_LANGUAGE_QUERY: 'natural-language-query',
      };

      const insightType = typeMap[type];

      const aiService = createAIService(context.user.id);
      const response = await aiService.generateInsight(insightType as any, {
        query,
        forceRefresh,
      });

      // Get the created insight from database
      const insight = await prisma.aIInsight.findFirst({
        where: {
          userId: context.user.id,
          response,
        },
        orderBy: { createdAt: 'desc' },
      });

      return insight;
    },

    // Regenerate Insight
    regenerateInsight: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const existingInsight = await prisma.aIInsight.findFirst({
        where: {
          id: args.id,
          userId: context.user.id,
        },
      });

      if (!existingInsight) {
        throw new GraphQLError('Insight not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Generate new insight with force refresh
      const aiService = createAIService(context.user.id);
      const response = await aiService.generateInsight(
        existingInsight.insightType.toLowerCase().replace('_', '-') as any,
        {
          query: existingInsight.query || undefined,
          forceRefresh: true,
        },
      );

      // Get the newly created insight
      const newInsight = await prisma.aIInsight.findFirst({
        where: {
          userId: context.user.id,
          response,
        },
        orderBy: { createdAt: 'desc' },
      });

      return newInsight;
    },

    // Delete Insight
    deleteInsight: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      await prisma.aIInsight.delete({
        where: {
          id: args.id,
          userId: context.user.id,
        },
      });

      return true;
    },

    // Clear Cache
    clearCache: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (args.pattern) {
        await RedisCache.deletePattern(args.pattern);
      } else {
        // Clear all user caches
        await RedisCache.deletePattern(`user:${context.user.id}:*`);
        await RedisCache.deletePattern(`ai:${context.user.id}:*`);
      }

      return true;
    },
  },
  ...subscriptionResolvers,
};
