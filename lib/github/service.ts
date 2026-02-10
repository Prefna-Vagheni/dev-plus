// lib/github/service.ts - GitHub Service Layer
import { prisma } from '@/lib/db';
import { createGitHubClient } from './client';
import { EventType, EventSource } from '@prisma/client';

export class GitHubService {
  private userId: string;
  private accessToken: string;
  private githubClient: ReturnType<typeof createGitHubClient>;

  constructor(userId: string, accessToken: string) {
    this.userId = userId;
    this.accessToken = accessToken;
    this.githubClient = createGitHubClient(accessToken);
  }

  /**
   * Sync user's repositories to database
   */
  async syncRepositories() {
    try {
      console.log(`[GitHub Sync] Syncing repositories for user ${this.userId}`);

      const repos = await this.githubClient.getRepositories({
        sort: 'updated',
        per_page: 100,
      });

      const syncedRepos = [];

      for (const repo of repos) {
        const repository = await prisma.repository.upsert({
          where: {
            userId_githubRepoId: {
              userId: this.userId,
              githubRepoId: String(repo.id),
            },
          },
          create: {
            userId: this.userId,
            githubRepoId: String(repo.id),
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            isPrivate: repo.private,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            lastActivityAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
          },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            isPrivate: repo.private,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            lastActivityAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            lastSyncAt: new Date(),
          },
        });

        syncedRepos.push(repository);
      }

      console.log(`[GitHub Sync] Synced ${syncedRepos.length} repositories`);
      return syncedRepos;
    } catch (error) {
      console.error('[GitHub Sync] Error syncing repositories:', error);
      throw error;
    }
  }

  /**
   * Sync commits for all
   */
  async syncCommits(since?: Date) {
    try {
      const sinceDate =
        since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days
      console.log(
        `[GitHub Sync] Syncing commits since ${sinceDate.toISOString()}`,
      );

      const user = await prisma.user.findUnique({
        where: { id: this.userId },
        select: { githubUsername: true },
      });

      if (!user?.githubUsername) {
        throw new Error('User GitHub username not found');
      }

      const commits = await this.githubClient.getUserCommits(
        user.githubUsername,
        sinceDate,
      );

      let syncedCount = 0;

      for (const commit of commits) {
        // Check if commit already exists
        const exists = await prisma.activityEvent.findFirst({
          where: {
            userId: this.userId,
            eventType: EventType.COMMIT,
            eventData: {
              path: ['sha'],
              equals: commit.sha,
            },
          },
        });

        if (exists) continue;

        await prisma.activityEvent.create({
          data: {
            userId: this.userId,
            eventType: EventType.COMMIT,
            source: EventSource.GITHUB,
            repositoryName: commit.repository.name,
            language: commit.repository.language || undefined,
            eventData: {
              sha: commit.sha,
              message: commit.commit.message,
              author: commit.commit.author?.name,
              authorEmail: commit.commit.author?.email,
              url: commit.html_url,
              additions: (commit as any).stats?.additions,
              deletions: (commit as any).stats?.deletions,
            },
            occurredAt: new Date(commit.commit.author?.date || Date.now()),
          },
        });

        syncedCount++;
      }

      console.log(`[GitHub Sync] Synced ${syncedCount} new commits`);
      return { total: commits.length, synced: syncedCount };
    } catch (error) {
      console.error('[GitHub Sync] Error syncing commits:', error);
      throw error;
    }
  }

  /**
   * Sync pull requests for all repositories
   */
  async syncPullRequests(since?: Date) {
    try {
      console.log('[GitHub Sync] Syncing pull requests');

      const repositories = await prisma.repository.findMany({
        where: { userId: this.userId },
        select: { fullName: true, githubRepoId: true },
      });

      let syncedCount = 0;

      for (const repo of repositories) {
        const [owner, repoName] = repo.fullName.split('/');
        if (!owner || !repoName) continue;

        try {
          const prs = await this.githubClient.getPullRequests(owner, repoName, {
            state: 'all',
            per_page: 50,
          });

          for (const pr of prs) {
            // Skip if already exists
            const exists = await prisma.activityEvent.findFirst({
              where: {
                userId: this.userId,
                eventType: EventType.PULL_REQUEST,
                eventData: {
                  path: ['number'],
                  equals: pr.number,
                },
                repositoryName: repoName,
              },
            });

            if (exists) continue;

            await prisma.activityEvent.create({
              data: {
                userId: this.userId,
                eventType: EventType.PULL_REQUEST,
                source: EventSource.GITHUB,
                repositoryName: repoName,
                eventData: {
                  number: pr.number,
                  title: pr.title,
                  state: pr.state,
                  url: pr.html_url,
                  author: pr.user?.login,
                  merged: pr.merged_at ? true : false,
                  createdAt: pr.created_at,
                  closedAt: pr.closed_at,
                },
                occurredAt: new Date(pr.created_at),
              },
            });

            syncedCount++;
          }
        } catch (error) {
          console.warn(`Failed to sync PRs for ${repo.fullName}:`, error);
        }
      }

      console.log(`[GitHub Sync] Synced ${syncedCount} pull requests`);
      return { synced: syncedCount };
    } catch (error) {
      console.error('[GitHub Sync] Error syncing pull requests:', error);
      throw error;
    }
  }

  /**
   * Sync issues for all repositories
   */
  async syncIssues(since?: Date) {
    try {
      console.log('[GitHub Sync] Syncing issues');

      const repositories = await prisma.repository.findMany({
        where: { userId: this.userId },
        select: { fullName: true, githubRepoId: true },
      });

      let syncedCount = 0;

      for (const repo of repositories) {
        const [owner, repoName] = repo.fullName.split('/');
        if (!owner || !repoName) continue;

        try {
          const issues = await this.githubClient.getIssues(owner, repoName, {
            state: 'all',
            since,
            per_page: 50,
          });

          for (const issue of issues) {
            const exists = await prisma.activityEvent.findFirst({
              where: {
                userId: this.userId,
                eventType: EventType.ISSUE,
                eventData: {
                  path: ['number'],
                  equals: issue.number,
                },
                repositoryName: repoName,
              },
            });

            if (exists) continue;

            await prisma.activityEvent.create({
              data: {
                userId: this.userId,
                eventType: EventType.ISSUE,
                source: EventSource.GITHUB,
                repositoryName: repoName,
                eventData: {
                  number: issue.number,
                  title: issue.title,
                  state: issue.state,
                  url: issue.html_url,
                  author: issue.user?.login,
                  labels: issue.labels.map((l) =>
                    typeof l === 'string' ? l : l.name,
                  ),
                  createdAt: issue.created_at,
                  closedAt: issue.closed_at,
                },
                occurredAt: new Date(issue.created_at),
              },
            });

            syncedCount++;
          }
        } catch (error) {
          console.warn(`Failed to sync issues for ${repo.fullName}:`, error);
        }
      }

      console.log(`[GitHub Sync] Synced ${syncedCount} issues`);
      return { synced: syncedCount };
    } catch (error) {
      console.error('[GitHub Sync] Error syncing issues:', error);
      throw error;
    }
  }

  /**
   * Full sync - all data types
   */
  async syncAll(since?: Date) {
    try {
      console.log('[GitHub Sync] Starting full sync');

      const results = {
        repositories: await this.syncRepositories(),
        commits: await this.syncCommits(since),
        pullRequests: await this.syncPullRequests(since),
        issues: await this.syncIssues(since),
      };

      console.log('[GitHub Sync] Full sync completed', results);
      return results;
    } catch (error) {
      console.error('[GitHub Sync] Error in full sync:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const [repositories, commits, pullRequests, issues] = await Promise.all([
      prisma.repository.count({ where: { userId: this.userId } }),
      prisma.activityEvent.count({
        where: { userId: this.userId, eventType: EventType.COMMIT },
      }),
      prisma.activityEvent.count({
        where: { userId: this.userId, eventType: EventType.PULL_REQUEST },
      }),
      prisma.activityEvent.count({
        where: { userId: this.userId, eventType: EventType.ISSUE },
      }),
    ]);

    return {
      repositories,
      commits,
      pullRequests,
      issues,
      totalEvents: commits + pullRequests + issues,
    };
  }
}

/**
 * Helper to get user's GitHub access token from database
 */
export async function getUserGitHubToken(
  userId: string,
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'github',
    },
    select: {
      accessToken: true,
    },
  });

  return account?.accessToken || null;
}

/**
 * Create GitHub service instance for a user
 */
export async function createGitHubService(userId: string) {
  const accessToken = await getUserGitHubToken(userId);

  if (!accessToken) {
    throw new Error('GitHub access token not found for user');
  }

  return new GitHubService(userId, accessToken);
}
