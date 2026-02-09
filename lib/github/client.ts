// lib/github/client.ts - GitHub API Client
import { Octokit } from '@octokit/rest';

export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
      userAgent: 'DevPulse/1.0.0',
      timeZone: 'UTC',
    });
  }

  /**
   * Get authenticated user's profile
   */
  async getUser() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return data;
    } catch (error) {
      console.error('GitHub API Error - getUser:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get user's repositories
   */
  async getRepositories(options?: {
    visibility?: 'all' | 'public' | 'private';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
  }) {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        visibility: options?.visibility || 'all',
        sort: options?.sort || 'updated',
        direction: options?.direction || 'desc',
        per_page: options?.per_page || 100,
      });
      return data;
    } catch (error) {
      console.error('GitHub API Error - getRepositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  /**
   * Get commits for a specific repository
   */
  async getCommits(
    owner: string,
    repo: string,
    options?: {
      since?: Date;
      until?: Date;
      per_page?: number;
      page?: number;
    },
  ) {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        since: options?.since?.toISOString(),
        until: options?.until?.toISOString(),
        per_page: options?.per_page || 100,
        page: options?.page || 1,
      });
      return data;
    } catch (error) {
      console.error(`GitHub API Error - getCommits (${owner}/${repo}):`, error);
      throw new Error(`Failed to fetch commits for ${owner}/${repo}`);
    }
  }

  /**
   * Get pull requests for a specific repository
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    },
  ) {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: options?.state || 'all',
        sort: options?.sort || 'created',
        direction: options?.direction || 'desc',
        per_page: options?.per_page || 100,
        page: options?.page || 1,
      });
      return data;
    } catch (error) {
      console.error(
        `GitHub API Error - getPullRequests (${owner}/${repo}):`,
        error,
      );
      throw new Error(`Failed to fetch pull requests for ${owner}/${repo}`);
    }
  }

  /**
   * Get issues for a specific repository
   */
  async getIssues(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      since?: Date;
      per_page?: number;
      page?: number;
    },
  ) {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: options?.state || 'all',
        since: options?.since?.toISOString(),
        per_page: options?.per_page || 100,
        page: options?.page || 1,
      });

      // Filter out pull requests (GitHub API returns PRs as issues)
      return data.filter((issue) => !issue.pull_request);
    } catch (error) {
      console.error(`GitHub API Error - getIssues (${owner}/${repo}):`, error);
      throw new Error(`Failed to fetch issues for ${owner}/${repo}`);
    }
  }

  /**
   * Get user's commit activity across all repos
   */
  async getUserCommits(username: string, since?: Date) {
    try {
      const repos = await this.getRepositories();
      const allCommits = [];

      for (const repo of repos) {
        try {
          const commits = await this.getCommits(repo.owner.login, repo.name, {
            since,
            per_page: 100,
          });

          // Filter commits by the authenticated user
          const userCommits = commits.filter(
            (commit) => commit.author?.login === username,
          );

          allCommits.push(
            ...userCommits.map((commit) => ({
              ...commit,
              repository: {
                name: repo.name,
                fullName: repo.full_name,
                language: repo.language,
              },
            })),
          );
        } catch (error) {
          // Continue even if one repo fails
          console.warn(`Failed to fetch commits for ${repo.full_name}:`, error);
        }
      }

      return allCommits;
    } catch (error) {
      console.error('GitHub API Error - getUserCommits:', error);
      throw new Error('Failed to fetch user commits');
    }
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo,
      });
      return data;
    } catch (error) {
      console.error(
        `GitHub API Error - getRepositoryLanguages (${owner}/${repo}):`,
        error,
      );
      throw new Error(`Failed to fetch languages for ${owner}/${repo}`);
    }
  }

  /**
   * Get user's events (activity feed)
   */
  async getUserEvents(username: string, per_page: number = 100) {
    try {
      const { data } =
        await this.octokit.activity.listEventsForAuthenticatedUser({
          username,
          per_page,
        });
      return data;
    } catch (error) {
      console.error('GitHub API Error - getUserEvents:', error);
      throw new Error('Failed to fetch user events');
    }
  }

  /**
   * Check rate limit status
   */
  async getRateLimit() {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return data;
    } catch (error) {
      console.error('GitHub API Error - getRateLimit:', error);
      throw new Error('Failed to fetch rate limit');
    }
  }
}

/**
 * Create a GitHub client instance with user's access token
 */
export function createGitHubClient(accessToken: string) {
  return new GitHubClient(accessToken);
}
