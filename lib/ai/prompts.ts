// lib/ai/prompts.ts - AI Prompt Templates
import { format } from 'date-fns';

export interface DeveloperData {
  overview: {
    totals: {
      commits: number;
      pullRequests: number;
      issues: number;
      codingHours: number;
      activeRepositories: number;
    };
    averages: {
      commitsPerDay: number;
      codingHoursPerDay: number;
    };
    insights: {
      mostActiveDay: string;
      totalDays: number;
      daysWithActivity: number;
    };
  };
  languages: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  repositories: Array<{
    name: string;
    commits: number;
    pullRequests: number;
    issues: number;
    totalActivity: number;
  }>;
  recentActivity: Array<{
    type: string;
    repositoryName: string;
    data: any;
    occurredAt: string;
  }>;
}

/**
 * System prompt for developer insights
 */
export const DEVELOPER_INSIGHTS_SYSTEM_PROMPT = `You are an AI developer coach and productivity analyst. Your role is to analyze a developer's GitHub activity and provide actionable, personalized insights.

Your analysis should be:
- **Specific**: Reference actual numbers and patterns from their data
- **Actionable**: Provide concrete suggestions they can implement
- **Encouraging**: Highlight strengths and frame areas for growth positively
- **Concise**: Keep insights focused and easy to scan

Format your response using markdown with clear sections. Use emojis sparingly but effectively for visual interest.

Available sections (use 2-3 most relevant):
- 📊 **Activity Summary**: High-level overview
- 🎯 **Strengths**: What they're doing well
- 💡 **Opportunities**: Areas for growth
- 🔥 **Hot Repositories**: Most active projects
- 📈 **Trends**: Patterns over time
- ⚡ **Quick Wins**: Easy improvements
- 🎨 **Language Focus**: Programming language insights`;

/**
 * Build prompt for weekly summary
 */
export function buildWeeklySummaryPrompt(data: DeveloperData): string {
  const { overview, languages, repositories } = data;

  return `Analyze this developer's activity from the past 7 days and provide a weekly summary.

## Activity Data

**Overall Metrics:**
- ${overview.totals.commits} commits
- ${overview.totals.pullRequests} pull requests
- ${overview.totals.issues} issues
- ${overview.totals.codingHours.toFixed(1)} hours of coding
- ${overview.totals.activeRepositories} active repositories
- ${overview.averages.commitsPerDay.toFixed(1)} commits per day average
- Most active on ${overview.insights.mostActiveDay}

**Top Languages:**
${languages
  .slice(0, 5)
  .map((lang) => `- ${lang.name}: ${lang.percentage.toFixed(1)}%`)
  .join('\n')}

**Most Active Repositories:**
${repositories
  .slice(0, 5)
  .map(
    (repo) =>
      `- ${repo.name}: ${repo.commits} commits, ${repo.pullRequests} PRs`,
  )
  .join('\n')}

Provide a concise weekly summary highlighting their productivity, key achievements, and one actionable suggestion for next week.`;
}

/**
 * Build prompt for productivity analysis
 */
export function buildProductivityAnalysisPrompt(data: DeveloperData): string {
  const { overview, repositories } = data;

  const activityRate =
    (overview.insights.daysWithActivity / overview.insights.totalDays) * 100;

  return `Analyze this developer's productivity patterns and provide insights.

## Productivity Metrics

**Consistency:**
- ${overview.insights.daysWithActivity} active days out of ${overview.insights.totalDays} (${activityRate.toFixed(1)}%)
- Most productive on ${overview.insights.mostActiveDay}
- ${overview.averages.codingHoursPerDay.toFixed(1)} hours coding per day on average

**Output:**
- ${overview.totals.commits} total commits
- ${overview.averages.commitsPerDay.toFixed(1)} commits per day
- ${overview.totals.pullRequests} pull requests
- ${overview.totals.activeRepositories} repositories worked on

**Repository Distribution:**
${repositories
  .slice(0, 5)
  .map((repo, i) => `${i + 1}. ${repo.name}: ${repo.totalActivity} activities`)
  .join('\n')}

Analyze their productivity patterns and suggest ways to optimize their workflow and maintain consistency.`;
}

/**
 * Build prompt for language recommendations
 */
export function buildLanguageRecommendationsPrompt(
  data: DeveloperData,
): string {
  const { languages, repositories } = data;

  return `Analyze this developer's programming language usage and provide recommendations.

## Language Breakdown

${languages.map((lang) => `- ${lang.name}: ${lang.value} uses (${lang.percentage.toFixed(1)}%)`).join('\n')}

## Active Projects

${repositories
  .slice(0, 5)
  .map((repo) => `- ${repo.name}`)
  .join('\n')}

Based on their current language mix and project types, suggest:
1. Which languages they should continue focusing on
2. Complementary languages that could enhance their stack
3. Learning resources or projects to explore`;
}

/**
 * Build prompt for natural language query
 */
export function buildNaturalLanguageQueryPrompt(
  query: string,
  data: DeveloperData,
): string {
  const { overview, languages, repositories, recentActivity } = data;

  return `Answer this developer's question about their coding activity.

## User Question
"${query}"

## Available Data

**Summary:**
- ${overview.totals.commits} commits in ${overview.insights.totalDays} days
- ${overview.totals.pullRequests} pull requests, ${overview.totals.issues} issues
- ${overview.totals.codingHours.toFixed(1)} hours of coding
- ${overview.totals.activeRepositories} active repositories

**Top Languages:**
${languages
  .slice(0, 5)
  .map((lang) => `- ${lang.name}: ${lang.percentage.toFixed(1)}%`)
  .join('\n')}

**Active Repositories:**
${repositories
  .slice(0, 10)
  .map(
    (repo) =>
      `- ${repo.name}: ${repo.commits} commits, ${repo.pullRequests} PRs, ${repo.issues} issues`,
  )
  .join('\n')}

**Recent Activity (last 10):**
${recentActivity
  .slice(0, 10)
  .map((activity) => {
    const time = format(new Date(activity.occurredAt), 'MMM d, HH:mm');
    return `- ${time}: ${activity.type} in ${activity.repositoryName}`;
  })
  .join('\n')}

Provide a direct, helpful answer to their question using the data above. If the data doesn't contain enough information to answer fully, acknowledge what you can and cannot determine from the available data.`;
}

/**
 * Build prompt for code pattern analysis
 */
export function buildCodePatternAnalysisPrompt(data: DeveloperData): string {
  const { overview, repositories, recentActivity } = data;

  return `Analyze this developer's coding patterns and work habits.

## Work Patterns

**Consistency:**
- ${overview.insights.daysWithActivity} active days out of ${overview.insights.totalDays}
- Most active on ${overview.insights.mostActiveDay}
- ${overview.averages.commitsPerDay.toFixed(1)} commits per day average

**Repository Focus:**
${repositories
  .slice(0, 5)
  .map((repo, i) => {
    const percentage =
      (repo.totalActivity /
        repositories.reduce((sum, r) => sum + r.totalActivity, 0)) *
      100;
    return `${i + 1}. ${repo.name}: ${percentage.toFixed(1)}% of activity`;
  })
  .join('\n')}

**Recent Activity Pattern:**
${recentActivity
  .slice(0, 20)
  .map((activity) => `- ${activity.type} in ${activity.repositoryName}`)
  .join('\n')}

Analyze their coding patterns and suggest optimizations for:
1. Focus and context-switching
2. Work-life balance
3. Project prioritization`;
}

/**
 * Build prompt for celebration/achievements
 */
export function buildAchievementsPrompt(data: DeveloperData): string {
  const { overview } = data;

  return `Celebrate this developer's recent achievements!

## Recent Milestones

- ✨ ${overview.totals.commits} commits completed
- 🔥 ${overview.totals.pullRequests} pull requests submitted
- 💪 ${overview.totals.codingHours.toFixed(1)} hours of focused coding
- 📦 ${overview.totals.activeRepositories} projects contributed to
- ${overview.insights.daysWithActivity} active coding days

Create an encouraging message that:
1. Highlights their most impressive metrics
2. Celebrates specific milestones (if any are notable)
3. Motivates them to keep up the great work

Keep it upbeat, specific, and genuine. Use 2-3 relevant emojis.`;
}
