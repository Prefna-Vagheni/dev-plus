// // app/dashboard/page.tsx
// import { Suspense } from 'react';
// import { getSession } from '@/lib/auth-utils';
// import { createAnalyticsService } from '@/lib/analytics/service';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Activity, GitCommit, GitPullRequest, Clock } from 'lucide-react';
// import { GitHubSyncButton } from '@/components/github/sync-button';
// import { CommitsChart } from '@/components/charts/commits-chart';
// import { LanguageChart } from '@/components/charts/language-chart';
// import { ActivityTimeline } from '@/components/analytics/activity-timeline';
// import { RepositoriesList } from '@/components/github/repositories-list';
// import Range from '@/components/date-range/date-range-picker';
// import { RealtimeActivityUpdates } from '@/components/realtime/activity-updates';

// // Stats cards data (will be dynamic later)
// async function getStats() {
//   // Simulate API call
//   await new Promise((resolve) => setTimeout(resolve, 1000));

//   return {
//     totalCommits: 247,
//     totalPRs: 42,
//     codingTime: '32.5h',
//     activeRepos: 8,
//   };
// }

// async function DashboardContent() {
//   const session = await getSession();
//   if (!session?.user) return null;

//   const analytics = createAnalyticsService(session.user.id);

//   const [overview, trends, languages] = await Promise.all([
//     analytics.getOverview(),
//     analytics.getTrends(),
//     analytics.getLanguageBreakdown(),
//   ]);

//   return (
//     <>
//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
//             <GitCommit className="h-4 w-4 text-gray-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{overview.totals.commits}</div>
//             <p className="text-xs text-gray-500">
//               {overview.averages.commitsPerDay.toFixed(1)} per day avg
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
//             <GitPullRequest className="h-4 w-4 text-gray-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {overview.totals.pullRequests}
//             </div>
//             <p className="text-xs text-gray-500">Last 30 days</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Coding Time</CardTitle>
//             <Clock className="h-4 w-4 text-gray-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {overview.totals.codingHours.toFixed(1)}h
//             </div>
//             <p className="text-xs text-gray-500">
//               {overview.averages.codingHoursPerDay.toFixed(1)}h per day avg
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Active Repos</CardTitle>
//             <Activity className="h-4 w-4 text-gray-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {overview.totals.activeRepositories}
//             </div>
//             <p className="text-xs text-gray-500">Repositories with activity</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Charts */}
//       <div className="grid gap-6 md:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle>Activity Trends</CardTitle>
//             <CardDescription>
//               Your commits, PRs, and issues over time
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <CommitsChart data={trends} />
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Language Distribution</CardTitle>
//             <CardDescription>
//               Your most used programming languages
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <LanguageChart data={languages.languages} />
//           </CardContent>
//         </Card>
//       </div>

//       {/* Timeline */}
//       <ActivityTimeline />
//     </>
//   );
// }

// function StatsCardSkeleton() {
//   return (
//     <Card>
//       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//         <Skeleton className="h-4 w-24" />
//         <Skeleton className="h-4 w-4" />
//       </CardHeader>
//       <CardContent>
//         <Skeleton className="h-8 w-16 mb-1" />
//         <Skeleton className="h-3 w-32" />
//       </CardContent>
//     </Card>
//   );
// }

// function StatsCard({
//   title,
//   value,
//   description,
//   icon: Icon,
// }: {
//   title: string;
//   value: string | number;
//   description: string;
//   //eslint-disable-next-line
//   icon: any;
// }) {
//   return (
//     <Card>
//       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//         <CardTitle className="text-sm font-medium">{title}</CardTitle>
//         <Icon className="h-4 w-4 text-gray-500" />
//       </CardHeader>
//       <CardContent>
//         <div className="text-2xl font-bold">{value}</div>
//         <p className="text-xs text-gray-500">{description}</p>
//       </CardContent>
//     </Card>
//   );
// }

// async function StatsCards() {
//   const stats = await getStats();

//   return (
//     <>
//       <StatsCard
//         title="Total Commits"
//         value={stats.totalCommits}
//         description="Last 30 days"
//         icon={GitCommit}
//       />
//       <StatsCard
//         title="Pull Requests"
//         value={stats.totalPRs}
//         description="Opened this month"
//         icon={GitPullRequest}
//       />
//       <StatsCard
//         title="Coding Time"
//         value={stats.codingTime}
//         description="This week"
//         icon={Clock}
//       />
//       <StatsCard
//         title="Active Repos"
//         value={stats.activeRepos}
//         description="Currently tracked"
//         icon={Activity}
//       />
//     </>
//   );
// }

// export default async function DashboardPage() {
//   const session = await getSession();

//   return (
//     <div className="space-y-6">
//       {/* Welcome section */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold tracking-tight">
//             Welcome back, {session?.user?.name?.split(' ')[0] || 'Developer'}!
//           </h2>
//           <p className="text-gray-500 dark:text-gray-400">
//             Here&apos;s what&apos;s happening with your development activity
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <Range />
//           <GitHubSyncButton />
//         </div>
//       </div>
//       <Suspense
//         fallback={
//           <>
//             <StatsCardSkeleton />
//             <StatsCardSkeleton />
//             <StatsCardSkeleton />
//             <StatsCardSkeleton />
//           </>
//         }
//       >
//         <DashboardContent />
//         <RealtimeActivityUpdates />
//       </Suspense>

//       {/* Stats grid */}
//       {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         <Suspense
//           fallback={
//             <>
//               <StatsCardSkeleton />
//               <StatsCardSkeleton />
//               <StatsCardSkeleton />
//               <StatsCardSkeleton />
//             </>
//           }
//         >
//           <StatsCards />
//         </Suspense>
//       </div> */}

//       {/* <RepositoriesList /> */}

//       {/* Main content grid */}
//       {/* <div className="grid gap-6 md:grid-cols-2">
//         <Card className="col-span-1">
//           <CardHeader>
//             <CardTitle>Recent Activity</CardTitle>
//             <CardDescription>Your latest commits and PRs</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {[1, 2, 3].map((i) => (
//                 <div key={i} className="flex items-start gap-4">
//                   <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
//                     <GitCommit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
//                   </div>
//                   <div className="flex-1 space-y-1">
//                     <Skeleton className="h-4 w-full" />
//                     <Skeleton className="h-3 w-2/3" />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="col-span-1">
//           <CardHeader>
//             <CardTitle>Language Distribution</CardTitle>
//             <CardDescription>Your most used languages</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {[
//                 { name: 'TypeScript', percentage: 45, color: 'bg-blue-600' },
//                 { name: 'JavaScript', percentage: 30, color: 'bg-yellow-500' },
//                 { name: 'Python', percentage: 25, color: 'bg-green-600' },
//               ].map((lang) => (
//                 <div key={lang.name} className="space-y-2">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="font-medium">{lang.name}</span>
//                     <span className="text-gray-500">{lang.percentage}%</span>
//                   </div>
//                   <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
//                     <div
//                       className={`h-full ${lang.color}`}
//                       style={{ width: `${lang.percentage}%` }}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div> */}

//       {/* Activity Timeline */}
//       {/* <Card>
//         <CardHeader>
//           <CardTitle>Activity Timeline</CardTitle>
//           <CardDescription>Your commits over the last 7 days</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="h-64 flex items-end justify-between gap-2">
//             {[12, 19, 8, 15, 23, 17, 20].map((height, i) => (
//               <div key={i} className="flex-1 flex flex-col items-center gap-2">
//                 <div
//                   className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition-colors"
//                   style={{ height: `${(height / 25) * 100}%` }}
//                 />
//                 <span className="text-xs text-gray-500">
//                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card> */}
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GitCommit, GitPullRequest, Clock, Activity } from 'lucide-react';
import { GitHubSyncButton } from '@/components/github/sync-button';
import { DateRangePicker } from '@/components/analytics/date-range-picker';
import { CommitsChart } from '@/components/charts/commits-chart';
import { LanguageChart } from '@/components/charts/language-chart';
import { ActivityTimeline } from '@/components/analytics/activity-timeline';
import { RealtimeActivityUpdates } from '@/components/realtime/activity-updates';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.set('from', dateRange.from.toISOString());
      if (dateRange?.to) params.set('to', dateRange.to.toISOString());

      const [overviewRes, trendsRes, languagesRes] = await Promise.all([
        fetch(`/api/analytics/overview?${params}`),
        fetch(`/api/analytics/trends?${params}`),
        fetch(`/api/analytics/languages?${params}`),
      ]);

      const overviewData = await overviewRes.json();
      const trendsData = await trendsRes.json();
      const languagesData = await languagesRes.json();

      setOverview(overviewData);
      setTrends(trendsData.trends);
      setLanguages(languagesData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  function StatsCardSkeleton() {
    return (
      <Card className=" w-full mb-2">
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

  if (isLoading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your development activity summary
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <GitHubSyncButton onSyncComplete={fetchAnalytics} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
            <GitCommit className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totals?.commits || 0}
            </div>
            <p className="text-xs text-gray-500">
              {overview?.averages?.commitsPerDay?.toFixed(1) || 0} per day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <GitPullRequest className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totals?.pullRequests || 0}
            </div>
            <p className="text-xs text-gray-500">
              {overview?.insights?.totalDays || 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coding Time</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totals?.codingHours?.toFixed(1) || 0}h
            </div>
            <p className="text-xs text-gray-500">
              {overview?.averages?.codingHoursPerDay?.toFixed(1) || 0}h per day
              avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Repos</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totals?.activeRepositories || 0}
            </div>
            <p className="text-xs text-gray-500">Repositories with activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends</CardTitle>
            <CardDescription>
              Your commits, PRs, and issues over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <CommitsChart data={trends} />
            ) : (
              <div className="h-75 flex items-center justify-center text-gray-500">
                No data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>
              Your most used programming languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {languages?.languages?.length > 0 ? (
              <LanguageChart data={languages.languages} />
            ) : (
              <div className="h-75 flex items-center justify-center text-gray-500">
                No language data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <ActivityTimeline />

      <RealtimeActivityUpdates />
    </div>
  );
}
