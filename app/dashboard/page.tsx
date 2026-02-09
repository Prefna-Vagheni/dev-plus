// app/dashboard/page.tsx
import { Suspense } from 'react';
import { getSession } from '@/lib/auth-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, GitCommit, GitPullRequest, Clock } from 'lucide-react';

// Stats cards data (will be dynamic later)
async function getStats() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    totalCommits: 247,
    totalPRs: 42,
    codingTime: '32.5h',
    activeRepos: 8,
  };
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}

async function StatsCards() {
  const stats = await getStats();

  return (
    <>
      <StatsCard
        title="Total Commits"
        value={stats.totalCommits}
        description="Last 30 days"
        icon={GitCommit}
      />
      <StatsCard
        title="Pull Requests"
        value={stats.totalPRs}
        description="Opened this month"
        icon={GitPullRequest}
      />
      <StatsCard
        title="Coding Time"
        value={stats.codingTime}
        description="This week"
        icon={Clock}
      />
      <StatsCard
        title="Active Repos"
        value={stats.activeRepos}
        description="Currently tracked"
        icon={Activity}
      />
    </>
  );
}

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Developer'}!
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Here&apos;s what&apos;s happening with your development activity
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense
          fallback={
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          }
        >
          <StatsCards />
        </Suspense>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest commits and PRs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                    <GitCommit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Your most used languages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'TypeScript', percentage: 45, color: 'bg-blue-600' },
                { name: 'JavaScript', percentage: 30, color: 'bg-yellow-500' },
                { name: 'Python', percentage: 25, color: 'bg-green-600' },
              ].map((lang) => (
                <div key={lang.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-gray-500">{lang.percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full ${lang.color}`}
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Your commits over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {[12, 19, 8, 15, 23, 17, 20].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition-colors"
                  style={{ height: `${(height / 25) * 100}%` }}
                />
                <span className="text-xs text-gray-500">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
