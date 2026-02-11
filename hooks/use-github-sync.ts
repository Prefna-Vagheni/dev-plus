// hooks/use-github-sync.ts - Client hooks for GitHub sync
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SyncOptions {
  syncType?: 'all' | 'repositories' | 'commits' | 'pullRequests' | 'issues';
  since?: Date;
}

export function useGitHubSync() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const triggerSync = async (options: SyncOptions = {}) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncType: options.syncType || 'all',
          since: options.since?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();

      toast({
        title: 'Sync completed!',
        description: `Successfully synced your GitHub data.`,
      });

      return data;
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'There was an error syncing your GitHub data.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerSync,
    isLoading,
  };
}

export function useGitHubStats() {
  // eslint-disable-next-line
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/github/sync');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
      return data.stats;
    } catch (error) {
      console.error('Error fetching GitHub stats:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    fetchStats,
    isLoading,
  };
}
