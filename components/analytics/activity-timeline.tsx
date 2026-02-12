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
    <Card className="w-full border-none shadow-none sm:border sm:shadow-sm">
      <CardHeader className="px-4 pb-3 sm:px-6">
        <CardTitle className="text-xl">Activity Timeline</CardTitle>
        <CardDescription>Your recent development activity</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="relative space-y-6">
          {/* Vertical Connector Line */}
          {events && events.length > 1 && (
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border sm:left-4" />
          )}

          {events && events.length > 0 ? (
            events.map((event, index) => (
              <div
                key={event.id}
                className="relative flex items-start gap-4 transition-all hover:bg-muted/50 p-2 -m-2 rounded-lg"
              >
                {/* Icon Container */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-background ${getEventColor(
                    event.type,
                  )} shadow-sm`}
                >
                  <div className="scale-75 sm:scale-90">
                    {getEventIcon(event.type)}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  {/* Header Row: Badges and Repo Name */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wider h-5"
                    >
                      {event.type.replace('_', ' ')}
                    </Badge>

                    {event.repositoryName && (
                      <span className="text-sm font-semibold truncate max-w-37.5 sm:max-w-none">
                        {event.repositoryName}
                      </span>
                    )}

                    {event.language && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 hidden min-[425px]:inline-flex"
                      >
                        {event.language}
                      </Badge>
                    )}
                  </div>

                  {/* Message / Title */}
                  {(event.data?.message || event.data?.title) && (
                    <div className="text-sm text-muted-foreground break-words">
                      <p className="line-clamp-2 leading-relaxed">
                        {event.data.message || event.data.title}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground/80 font-medium">
                    {formatDistanceToNow(new Date(event.occurredAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No recent activity found.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    // <Card className="w-full">
    //   <CardHeader className="pb-3 sm:px-6">
    //     <CardTitle className="text-xl">Activity Timeline</CardTitle>
    //     <CardDescription>Your recent development activity</CardDescription>
    //   </CardHeader>
    //   <CardContent className="px-1 sm:px-6">
    //     <div className="relative space-y-4">
    //       {events && events.length > 0 ? (
    //         events.map((event) => (
    //           <div
    //             key={event.id}
    //             className="relative flex items-start gap-4 transition-all hover:bg-muted/30 p-2 -m-2"
    //           >
    //             <div
    //               className={`relative z-10 flex h-6 w-6  sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full ${getEventColor(event.type)}`}
    //             >
    //               {getEventIcon(event.type)}
    //             </div>
    //             <div className="flex flex-1 flex-col gap-1 min-w-0">
    //               <div className="flex items-center gap-2">
    //                 <Badge variant="outline" className="text-xs">
    //                   {event.type.replace('_', ' ')}
    //                 </Badge>
    //                 {event.repositoryName && (
    //                   <span className="text-sm font-medium truncate max-w-37.5 sm:max-w-none">
    //                     {event.repositoryName}
    //                   </span>
    //                 )}
    //                 {event.language && (
    //                   <Badge
    //                     variant="secondary"
    //                     className="text-[10px] h-5 hidden xs:inline-flex"
    //                   >
    //                     {event.language}
    //                   </Badge>
    //                 )}
    //               </div>
    //               {event.data?.message && (
    //                 <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
    //                   {event.data.message}
    //                 </p>
    //               )}
    //               {event.data?.title && (
    //                 <p className="text-sm text-gray-600 dark:text-gray-400">
    //                   {event.data.title}
    //                 </p>
    //               )}
    //               <p className="text-xs text-gray-500">
    //                 {formatDistanceToNow(new Date(event.occurredAt), {
    //                   addSuffix: true,
    //                 })}
    //               </p>
    //             </div>
    //           </div>
    //         ))
    //       ) : (
    //         <p className="text-sm text-gray-500">No recent activity found.</p>
    //       )}
    //       {/* {events.map((event) => (
    //         <div key={event.id} className="flex gap-4">
    //           <div
    //             className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getEventColor(event.type)}`}
    //           >
    //             {getEventIcon(event.type)}
    //           </div>
    //           <div className="flex-1 space-y-1">
    //             <div className="flex items-center gap-2">
    //               <Badge variant="outline" className="text-xs">
    //                 {event.type.replace('_', ' ')}
    //               </Badge>
    //               {event.repositoryName && (
    //                 <span className="text-sm font-medium">
    //                   {event.repositoryName}
    //                 </span>
    //               )}
    //               {event.language && (
    //                 <Badge variant="secondary" className="text-xs">
    //                   {event.language}
    //                 </Badge>
    //               )}
    //             </div>
    //             {event.data.message && (
    //               <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
    //                 {event.data.message}
    //               </p>
    //             )}
    //             {event.data.title && (
    //               <p className="text-sm text-gray-600 dark:text-gray-400">
    //                 {event.data.title}
    //               </p>
    //             )}
    //             <p className="text-xs text-gray-500">
    //               {formatDistanceToNow(new Date(event.occurredAt), {
    //                 addSuffix: true,
    //               })}
    //             </p>
    //           </div>
    //         </div>
    //       ))} */}
    //     </div>
    //   </CardContent>
    // </Card>
  );
}
