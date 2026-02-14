// lib/graphql/queries.ts - GraphQL Queries
import { gql } from '@apollo/client';

export const GET_ANALYTICS_OVERVIEW = gql`
  query GetAnalyticsOverview($dateRange: DateRangeInput) {
    analyticsOverview(dateRange: $dateRange) {
      totals {
        commits
        pullRequests
        issues
        codingHours
        activeRepositories
      }
      averages {
        commitsPerDay
        codingHoursPerDay
      }
      insights {
        mostActiveDay
        totalDays
        daysWithActivity
      }
    }
  }
`;

export const GET_REPOSITORIES = gql`
  query GetRepositories($limit: Int, $offset: Int) {
    repositories(limit: $limit, offset: $offset) {
      id
      name
      description
      language
      stars
      forks
      isPrivate
      url
      totalCommits
      totalPullRequests
      totalIssues
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVITY_TIMELINE = gql`
  query GetActivityTimeline($limit: Int, $offset: Int) {
    activityTimeline(limit: $limit, offset: $offset) {
      id
      eventType
      source
      repositoryName
      language
      durationSeconds
      occurredAt
      eventData
    }
  }
`;

export const GET_LANGUAGE_BREAKDOWN = gql`
  query GetLanguageBreakdown($dateRange: DateRangeInput) {
    languageBreakdown(dateRange: $dateRange) {
      languages {
        name
        value
        percentage
      }
      totalLanguages
    }
  }
`;

export const GET_PRODUCTIVITY_TRENDS = gql`
  query GetProductivityTrends($dateRange: DateRangeInput) {
    productivityTrends(dateRange: $dateRange) {
      date
      commits
      pullRequests
      issues
      codingHours
    }
  }
`;

export const GET_AI_INSIGHTS = gql`
  query GetAIInsights($limit: Int) {
    aiInsights(limit: $limit) {
      id
      insightType
      title
      query
      response
      createdAt
      expiresAt
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      image
      githubUsername
      createdAt
    }
  }
`;
