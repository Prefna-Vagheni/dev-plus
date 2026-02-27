// components/ai/regenerate-insight-button.tsx - Regenerate Insight Button
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InsightType } from '@/hooks/use-ai-insights';

interface RegenerateInsightButtonProps {
  insightType: InsightType;
  query?: string;
  onRegenerated?: (newInsight: string) => void;
}

export function RegenerateInsightButton({
  insightType,
  query,
  onRegenerated,
}: RegenerateInsightButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsRegenerating(true);

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: insightType,
          query,
          forceRefresh: true, // This bypasses cache
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate insight');
      }

      const data = await response.json();

      toast({
        title: 'Insight Regenerated',
        description: 'Your fresh insight is ready!',
      });

      onRegenerated?.(data.insight);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate insight',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Button
      onClick={handleRegenerate}
      disabled={isRegenerating}
      variant="outline"
      size="sm"
    >
      {isRegenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Regenerating...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </>
      )}
    </Button>
  );
}
