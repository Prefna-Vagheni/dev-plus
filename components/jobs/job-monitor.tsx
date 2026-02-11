// components/jobs/job-monitor.tsx - Job Monitoring Dashboard
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

interface JobData {
  userId?: string; // Explicitly typed for the UI
  [key: string]: unknown; // Allows any other properties safely
}

interface Job {
  id: string;
  name: string;
  data: JobData;
  progress: number | null;
  state: string;
  timestamp: number;
  finishedOn?: number;
  failedReason?: string;
}

interface QueueStats {
  metrics: QueueMetrics;
  recentJobs: Job[];
}

export function JobMonitor() {
  const [stats, setStats] = useState<{
    githubSync: QueueStats;
    dataAggregation: QueueStats;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/jobs/stats');
      const data = await response.json();
      setStats(data.queues);
    } catch (error) {
      console.error('Error fetching job stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'active':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'waiting':
      case 'delayed':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'active':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'waiting':
      case 'delayed':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Monitor</h2>
          <p className="text-sm text-gray-500">Background job queue status</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* GitHub Sync Queue */}
        <Card>
          <CardHeader>
            <CardTitle>GitHub Sync Queue</CardTitle>
            <CardDescription>
              Background GitHub data synchronization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Waiting</p>
                <p className="text-2xl font-bold">
                  {stats?.githubSync.metrics.waiting || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.githubSync.metrics.active || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.githubSync.metrics.completed || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.githubSync.metrics.failed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Aggregation Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Data Aggregation Queue</CardTitle>
            <CardDescription>Daily statistics computation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Waiting</p>
                <p className="text-2xl font-bold">
                  {stats?.dataAggregation.metrics.waiting || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.dataAggregation.metrics.active || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.dataAggregation.metrics.completed || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.dataAggregation.metrics.failed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Last 10 jobs across all queues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.githubSync.recentJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getStateColor(job.state)}>
                      {getStateIcon(job.state)}
                      <span className="ml-1 capitalize">{job.state}</span>
                    </Badge>
                    <span className="font-medium">{job.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    User ID: {job.data.userId?.slice(0, 8)}...
                  </p>
                  {job.state === 'active' && job.progress !== null && (
                    <Progress value={job.progress} className="h-2" />
                  )}
                  {job.failedReason && (
                    <p className="text-sm text-red-600">{job.failedReason}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {job.finishedOn
                    ? new Date(job.finishedOn).toLocaleTimeString()
                    : new Date(job.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {(!stats?.githubSync.recentJobs ||
              stats.githubSync.recentJobs.length === 0) && (
              <p className="text-center text-sm text-gray-500 py-8">
                No recent jobs
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
