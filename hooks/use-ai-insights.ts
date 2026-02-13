'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export type InsightType =
  | 'weekly-summary'
  | 'productivity-analysis'
  | 'language-recommendations'
  | 'code-patterns'
  | 'achievements'
  | 'natural-language-query';

export function useAIInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const { toast } = useToast();

  const generateInsight = async (type: InsightType, query?: string) => {
    setIsLoading(true);
    setInsight(null);

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, query }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      setInsight(data.insight);

      toast({
        title: 'Insight Generated',
        description: 'Your AI insight is ready!',
      });

      return data.insight;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate insight',
        variant: 'destructive',
      });
      console.error('AI Provider Error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateInsight,
    insight,
    isLoading,
  };
}

export function useAIInsightsStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const { toast } = useToast();

  const generateStreamingInsight = async (
    type: InsightType,
    query?: string,
  ) => {
    setIsStreaming(true);
    setStreamedContent('');

    try {
      const response = await fetch('/api/ai/insights/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, query }),
      });

      if (!response.ok) throw new Error('Failed to start stream');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');

      let buffer = ''; // <--- 1. Buffer for incomplete chunks

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 2. Append new data to buffer
        buffer += decoder.decode(value, { stream: true });

        // 3. Process complete lines only
        const lines = buffer.split('\n\n');

        // Keep the last fragment in the buffer (it might be incomplete)
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);

            if (data.chunk) {
              setStreamedContent((prev) => prev + data.chunk);
            }
            if (data.done) {
              setIsStreaming(false);
              toast({ title: 'Complete', description: 'Insight generated' });
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error('Error parsing stream chunk', e);
          }
        }
      }
    } catch (error: any) {
      console.error('Streaming error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate insight',
        variant: 'destructive',
      });
      setIsStreaming(false);
    }
  };

  return {
    generateStreamingInsight,
    streamedContent,
    isStreaming,
  };
}
