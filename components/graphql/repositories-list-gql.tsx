// components/graphql/repositories-list-gql.tsx - GraphQL-powered Repository List
'use client';

// import { useQuery } from '@apollo/client';
import { GET_REPOSITORIES } from '@/lib/graphql/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, GitFork, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@apollo/client/react';

interface Repository {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  isPrivate: boolean;
  url: string;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  createdAt: string;
  updatedAt: string;
}

export function RepositoriesListGraphQL() {
  const { data, loading, error, fetchMore } = useQuery<{
    repositories: Repository[];
  }>(GET_REPOSITORIES, {
    variables: {
      limit: 10,
      offset: 0,
    },
  });

  const handleLoadMore = () => {
    fetchMore({
      variables: {
        offset: data?.repositories.length || 0,
      },
    });
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>Failed to load repositories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.repositories || data.repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Repositories</CardTitle>
          <CardDescription>
            No repositories found. Sync your GitHub data to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.repositories.map((repo) => (
        <Card key={repo.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{repo.name}</CardTitle>
                  {repo.isPrivate && (
                    <Badge variant="secondary" className="text-xs">
                      Private
                    </Badge>
                  )}
                  {repo.language && (
                    <Badge variant="outline" className="text-xs">
                      <Code className="mr-1 h-3 w-3" />
                      {repo.language}
                    </Badge>
                  )}
                </div>
                {repo.description && (
                  <CardDescription className="line-clamp-2">
                    {repo.description}
                  </CardDescription>
                )}
              </div>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{repo.stars}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                <span>{repo.forks}</span>
              </div>
              <div className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                <span>{repo.totalCommits} commits</span>
              </div>
              {repo.totalPullRequests > 0 && (
                <div className="flex items-center gap-1">
                  <span>{repo.totalPullRequests} PRs</span>
                </div>
              )}
              {repo.totalIssues > 0 && (
                <div className="flex items-center gap-1">
                  <span>{repo.totalIssues} issues</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {data.repositories.length >= 10 && (
        <div className="flex justify-center pt-4">
          <Button onClick={handleLoadMore} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
