// components/realtime/activity-updates.tsx - Real-time Activity Updates
'use client';

import { useEffect, useState } from 'react';
import { useWebSocketContext } from '@/components/providers/websocket-provider';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface RealtimeActivity {
  id: string;
  type: 'COMMIT' | 'PULL_REQUEST' | 'ISSUE' | 'CODE_SESSION';
  repositoryName: string;
  message: string;
  timestamp: string;
}

export function RealtimeActivityUpdates() {
  const { connected, on, off } = useWebSocketContext();
  const { toast } = useToast();
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);

  useEffect(() => {
    // Subscribe to real-time activity events
    const handleNewActivity = (data: RealtimeActivity) => {
      console.log('[Realtime] New activity:', data);

      // Add to activities list
      setActivities((prev) => [data, ...prev].slice(0, 10)); // Keep last 10

      // Show toast notification
      toast({
        title: 'New Activity',
        description: `${data.type}: ${data.message.slice(0, 50)}...`,
        // duration: 3000,
      });
    };

    const handleSyncComplete = (data: any) => {
      console.log('[Realtime] Sync completed:', data);

      toast({
        title: 'Sync Complete',
        description: `Synced ${data.itemsProcessed || 0} items`,
      });
    };

    const handleStatsUpdate = (data: any) => {
      console.log('[Realtime] Stats updated:', data);
    };

    // Listen to events
    on('activity:new', handleNewActivity);
    on('sync:complete', handleSyncComplete);
    on('stats:updated', handleStatsUpdate);

    return () => {
      off('activity:new', handleNewActivity);
      off('sync:complete', handleSyncComplete);
      off('stats:updated', handleStatsUpdate);
    };
  }, [on, off, toast]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'COMMIT':
        return <GitCommit className="h-4 w-4" />;
      case 'PULL_REQUEST':
        return <GitPullRequest className="h-4 w-4" />;
      case 'ISSUE':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <GitCommit className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'COMMIT':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'PULL_REQUEST':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'ISSUE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Activity</CardTitle>
            <CardDescription>
              Real-time updates from your GitHub
            </CardDescription>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? (
              <>
                <Wifi className="mr-1 h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="mr-1 h-3 w-3" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Waiting for new activity...</p>
            <p className="text-sm mt-2">
              {connected ? 'Connected and listening' : 'Connecting...'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 items-start">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActivityColor(
                    activity.type,
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                    <span className="text-sm font-medium">
                      {activity.repositoryName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
