// components/github/sync-button.tsx - GitHub Sync Button
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useGitHubSync } from '@/hooks/use-github-sync';

interface GitHubSyncButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  onSyncComplete?: () => void;
}

export function GitHubSyncButton({
  variant = 'outline',
  size = 'default',
  onSyncComplete,
}: GitHubSyncButtonProps) {
  const { triggerSync, isLoading } = useGitHubSync();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSync = async () => {
    try {
      await triggerSync({ syncType: 'all' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      onSyncComplete?.();
    } catch (error) {
      // Error is handled by the hook
      console.log(error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isLoading}
    >
      {showSuccess ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Synced!
        </>
      ) : (
        <>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          {isLoading ? 'Syncing...' : 'Sync GitHub'}
        </>
      )}
    </Button>
  );
}
