// lib/graphql/schema.ts - GraphQL Type Definitions
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    name: String
    image: String
    githubUsername: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Repository {
    id: ID!
    name: String!
    description: String
    language: String
    stars: Int!
    forks: Int!
    isPrivate: Boolean!
    url: String
    createdAt: DateTime!
    updatedAt: DateTime!

    # Aggregated stats
    totalCommits: Int!
    totalPullRequests: Int!
    totalIssues: Int!
  }

  type ActivityEvent {
    id: ID!
    eventType: String!
    source: String!
    repositoryName: String
    language: String
    durationSeconds: Int
    occurredAt: DateTime!
    eventData: JSON
  }

  type DailyStat {
    id: ID!
    statDate: DateTime!
    totalCommits: Int!
    totalPullRequests: Int!
    totalIssues: Int!
    codingTimeSeconds: Int!
    languages: JSON
    activeRepositories: [String!]!
    linesAdded: Int!
    linesDeleted: Int!
  }

  type AnalyticsOverview {
    totals: Totals!
    averages: Averages!
    insights: Insights!
  }

  type Totals {
    commits: Int!
    pullRequests: Int!
    issues: Int!
    codingHours: Float!
    activeRepositories: Int!
  }

  type Averages {
    commitsPerDay: Float!
    codingHoursPerDay: Float!
  }

  type Insights {
    mostActiveDay: String!
    totalDays: Int!
    daysWithActivity: Int!
  }

  type Language {
    name: String!
    value: Int!
    percentage: Float!
  }

  type LanguageBreakdown {
    languages: [Language!]!
    totalLanguages: Int!
  }

  type RepositoryActivity {
    name: String!
    commits: Int!
    pullRequests: Int!
    issues: Int!
    totalActivity: Int!
  }

  type ProductivityTrend {
    date: DateTime!
    commits: Int!
    pullRequests: Int!
    issues: Int!
    codingHours: Float!
  }

  type AIInsight {
    id: ID!
    insightType: String!
    title: String!
    query: String
    response: String!
    createdAt: DateTime!
    expiresAt: DateTime!
  }

  type SyncJob {
    id: ID!
    jobType: String!
    status: String!
    startedAt: DateTime
    completedAt: DateTime
    itemsProcessed: Int
    errorMessage: String
  }

  input DateRangeInput {
    from: DateTime!
    to: DateTime!
  }

  input GenerateInsightInput {
    type: InsightType!
    query: String
    forceRefresh: Boolean
  }

  enum InsightType {
    WEEKLY_SUMMARY
    PRODUCTIVITY_ANALYSIS
    LANGUAGE_RECOMMENDATIONS
    CODE_PATTERNS
    ACHIEVEMENTS
    NATURAL_LANGUAGE_QUERY
  }

  input SyncInput {
    syncType: SyncType!
    incremental: Boolean
  }

  enum SyncType {
    REPOSITORIES
    COMMITS
    PULL_REQUESTS
    ISSUES
    ALL
  }

  type Query {
    # Current user
    me: User

    # Analytics
    analyticsOverview(dateRange: DateRangeInput): AnalyticsOverview!
    productivityTrends(dateRange: DateRangeInput): [ProductivityTrend!]!
    languageBreakdown(dateRange: DateRangeInput): LanguageBreakdown!
    repositoryActivity(dateRange: DateRangeInput): [RepositoryActivity!]!

    # Repositories
    repositories(limit: Int, offset: Int): [Repository!]!
    repository(id: ID!): Repository

    # Activity
    activityTimeline(limit: Int, offset: Int): [ActivityEvent!]!
    dailyStats(dateRange: DateRangeInput): [DailyStat!]!

    # AI Insights
    aiInsights(limit: Int): [AIInsight!]!
    aiInsight(id: ID!): AIInsight

    # Sync Jobs
    syncJobs(limit: Int): [SyncJob!]!
    recentSyncJob: SyncJob
  }

  type Mutation {
    # GitHub Sync
    triggerSync(input: SyncInput!): SyncJob!

    # AI Insights
    generateInsight(input: GenerateInsightInput!): AIInsight!
    regenerateInsight(id: ID!): AIInsight!
    deleteInsight(id: ID!): Boolean!

    # Cache Management
    clearCache(pattern: String): Boolean!
  }

  type Subscription {
    # Real-time sync updates
    syncJobUpdated(userId: ID!): SyncJob!

    # Real-time activity
    activityEventCreated(userId: ID!): ActivityEvent!

    # AI Insight generation progress
    insightGenerating(userId: ID!): InsightProgress!
  }

  type InsightProgress {
    insightId: ID!
    status: String!
    progress: Int!
    content: String
  }
`;
