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
import { GitCommit, GitPullRequest, AlertCircle, Code2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: string;
  repositoryName: string | null;
  language: string | null;
  data: any;
  occurredAt: string;
}

export function ActivityTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const response = await fetch('/api/analytics/timeline?limit=20');
      const data = await response.json();
      setEvents(data.timeline);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'COMMIT':
        return <GitCommit className="h-4 w-4" />;
      case 'PULL_REQUEST':
        return <GitPullRequest className="h-4 w-4" />;
      case 'ISSUE':
        return <AlertCircle className="h-4 w-4" />;
      case 'CODE_SESSION':
        return <Code2 className="h-4 w-4" />;
      default:
        return <GitCommit className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'COMMIT':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'PULL_REQUEST':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'ISSUE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'CODE_SESSION':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Your recent development activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getEventColor(event.type)}`}
              >
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {event.type.replace('_', ' ')}
                  </Badge>
                  {event.repositoryName && (
                    <span className="text-sm font-medium">
                      {event.repositoryName}
                    </span>
                  )}
                  {event.language && (
                    <Badge variant="secondary" className="text-xs">
                      {event.language}
                    </Badge>
                  )}
                </div>
                {event.data.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {event.data.message}
                  </p>
                )}
                {event.data.title && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.data.title}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(event.occurredAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
