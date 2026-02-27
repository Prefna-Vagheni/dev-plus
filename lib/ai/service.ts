// lib/ai/service.ts - Fixed AI Service with correct model name
import { GeminiClient, Message } from './gemini-client';
import {
  DEVELOPER_INSIGHTS_SYSTEM_PROMPT,
  buildWeeklySummaryPrompt,
  buildProductivityAnalysisPrompt,
  buildLanguageRecommendationsPrompt,
  buildNaturalLanguageQueryPrompt,
  buildCodePatternAnalysisPrompt,
  buildAchievementsPrompt,
  DeveloperData,
} from './prompts';
import { prisma } from '@/lib/db';
import { RedisCache, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';

export type InsightType =
  | 'weekly-summary'
  | 'productivity-analysis'
  | 'language-recommendations'
  | 'code-patterns'
  | 'achievements'
  | 'natural-language-query';

export class AIService {
  constructor(private userId: string) {}

  /**
   * Fetch developer data for AI analysis
   */
  private async fetchDeveloperData(dateRange?: {
    from: Date;
    to: Date;
  }): Promise<DeveloperData> {
    const { createAnalyticsService } = await import('@/lib/analytics/service');
    const analytics = createAnalyticsService(this.userId);

    const [overview, languages, repositories, timeline] = await Promise.all([
      analytics.getOverview(dateRange),
      analytics.getLanguageBreakdown(dateRange),
      analytics.getRepositoryActivity(dateRange),
      analytics.getActivityTimeline(20),
    ]);

    return {
      overview,
      languages: languages.languages,
      repositories,
      recentActivity: timeline.map((event) => ({
        type: event.type,
        repositoryName: event.repositoryName ?? 'Unknown Repository', // Provide fallback
        data: event.data,
        occurredAt: event.occurredAt,
      })),
    };
  }

  /**
   * Generate AI insight
   */
  async generateInsight(
    type: InsightType,
    options?: {
      query?: string;
      dateRange?: { from: Date; to: Date };
      forceRefresh?: boolean;
    },
  ): Promise<string> {
    if (!options?.forceRefresh) {
      const cacheKey = `ai:${this.userId}:${type}${options?.query ? `:${options.query}` : ''}`;
      const cached = await RedisCache.get<string>(cacheKey);

      if (cached) {
        console.log(`[AI] Cache HIT: ${cacheKey}`);
        return cached;
      }
    }

    const data = await this.fetchDeveloperData(options?.dateRange);
    let userPrompt: string;

    switch (type) {
      case 'weekly-summary':
        userPrompt = buildWeeklySummaryPrompt(data);
        break;
      case 'productivity-analysis':
        userPrompt = buildProductivityAnalysisPrompt(data);
        break;
      case 'language-recommendations':
        userPrompt = buildLanguageRecommendationsPrompt(data);
        break;
      case 'code-patterns':
        userPrompt = buildCodePatternAnalysisPrompt(data);
        break;
      case 'achievements':
        userPrompt = buildAchievementsPrompt(data);
        break;
      case 'natural-language-query':
        if (!options?.query) {
          throw new Error('Query is required for natural language queries');
        }
        userPrompt = buildNaturalLanguageQueryPrompt(options.query, data);
        break;
      default:
        throw new Error(`Unknown insight type: ${type}`);
    }

    const messages: Message[] = [{ role: 'user', content: userPrompt }];

    const response = await GeminiClient.complete(messages, {
      systemPrompt: DEVELOPER_INSIGHTS_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.7,
      model: 'gemini-2.5-flash', // FIXED: Use correct model name
    });

    const ttl =
      type === 'natural-language-query' ? CacheTTL.MEDIUM : CacheTTL.LONG;
    const cacheKey = `ai:${this.userId}:${type}${options?.query ? `:${options.query}` : ''}`;

    await RedisCache.set(cacheKey, response, ttl);
    await this.saveInsight(type, options?.query, response);

    return response;
  }

  /**
   * Generate streaming insight
   */
  async *generateInsightStream(
    type: InsightType,
    options?: {
      query?: string;
      dateRange?: { from: Date; to: Date };
    },
  ): AsyncGenerator<string> {
    const data = await this.fetchDeveloperData(options?.dateRange);
    let userPrompt: string;

    switch (type) {
      case 'weekly-summary':
        userPrompt = buildWeeklySummaryPrompt(data);
        break;
      case 'productivity-analysis':
        userPrompt = buildProductivityAnalysisPrompt(data);
        break;
      case 'language-recommendations':
        userPrompt = buildLanguageRecommendationsPrompt(data);
        break;
      case 'code-patterns':
        userPrompt = buildCodePatternAnalysisPrompt(data);
        break;
      case 'achievements':
        userPrompt = buildAchievementsPrompt(data);
        break;
      case 'natural-language-query':
        if (!options?.query) {
          throw new Error('Query is required for natural language queries');
        }
        userPrompt = buildNaturalLanguageQueryPrompt(options.query, data);
        break;
      default:
        throw new Error(`Unknown insight type: ${type}`);
    }

    const messages: Message[] = [{ role: 'user', content: userPrompt }];

    let fullResponse = '';

    for await (const chunk of GeminiClient.stream(messages, {
      systemPrompt: DEVELOPER_INSIGHTS_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.7,
      model: 'gemini-2.5-flash', // FIXED: Use correct model name (was gemini-1.5-flash)
    })) {
      if (chunk.type === 'text') {
        fullResponse += chunk.content;
        yield chunk.content;
      }

      if (chunk.type === 'done') {
        const cacheKey = `ai:${this.userId}:${type}${options?.query ? `:${options.query}` : ''}`;
        await RedisCache.set(cacheKey, fullResponse, CacheTTL.LONG);
        await this.saveInsight(type, options?.query, fullResponse);
      }
    }
  }

  private async saveInsight(
    type: InsightType,
    query: string | undefined,
    response: string,
  ): Promise<void> {
    try {
      await prisma.aIInsight.create({
        data: {
          userId: this.userId,
          insightType: this.mapTypeToEnum(type),
          title: this.generateTitle(type),
          query,
          response,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (error) {
      console.error('[AI] Error saving insight:', error);
    }
  }

  private mapTypeToEnum(type: InsightType): string {
    const mapping: Record<InsightType, string> = {
      'weekly-summary': 'WEEKLY_SUMMARY',
      'productivity-analysis': 'PRODUCTIVITY_TREND',
      'language-recommendations': 'RECOMMENDATION',
      'code-patterns': 'CODE_PATTERN_ANALYSIS',
      achievements: 'RECOMMENDATION',
      'natural-language-query': 'NATURAL_LANGUAGE_QUERY',
    };

    return mapping[type] || 'CUSTOM';
  }

  private generateTitle(type: InsightType): string {
    const titles: Record<InsightType, string> = {
      'weekly-summary': 'Weekly Activity Summary',
      'productivity-analysis': 'Productivity Analysis',
      'language-recommendations': 'Language Recommendations',
      'code-patterns': 'Code Pattern Analysis',
      achievements: 'Recent Achievements',
      'natural-language-query': 'Custom Query',
    };

    return titles[type] || 'AI Insight';
  }

  async getRecentInsights(limit: number = 10) {
    return prisma.aIInsight.findMany({
      where: {
        userId: this.userId,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  static async cleanupExpiredInsights(): Promise<number> {
    const result = await prisma.aIInsight.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}

export function createAIService(userId: string) {
  return new AIService(userId);
}
