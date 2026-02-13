'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIInsightsStream, InsightType } from '@/hooks/use-ai-insights';
import ReactMarkdown from 'react-markdown';

const INSIGHT_TYPES: Array<{
  value: InsightType;
  label: string;
  description: string;
}> = [
  {
    value: 'weekly-summary',
    label: 'Weekly Summary',
    description: 'Get a summary of your activity from the past week',
  },
  {
    value: 'productivity-analysis',
    label: 'Productivity Analysis',
    description: 'Analyze your coding patterns and productivity',
  },
  {
    value: 'language-recommendations',
    label: 'Language Recommendations',
    description: 'Get suggestions based on your language usage',
  },
  {
    value: 'code-patterns',
    label: 'Code Patterns',
    description: 'Discover insights about your coding habits',
  },
  {
    value: 'achievements',
    label: 'Celebrate Achievements',
    description: 'Highlight your recent accomplishments',
  },
  {
    value: 'natural-language-query',
    label: 'Ask a Question',
    description: 'Ask anything about your coding activity',
  },
];

export function InsightGenerator() {
  const [selectedType, setSelectedType] =
    useState<InsightType>('weekly-summary');
  const [query, setQuery] = useState('');
  const { generateStreamingInsight, streamedContent, isStreaming } =
    useAIInsightsStream();

  const handleGenerate = () => {
    generateStreamingInsight(selectedType, query || undefined);
  };

  const selectedInsight = INSIGHT_TYPES.find((t) => t.value === selectedType);
  const showQueryInput = selectedType === 'natural-language-query';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Insights (Powered by Gemini)
          </CardTitle>
          <CardDescription>
            Get personalized insights powered by Google Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Insight Type</label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as InsightType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSIGHT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showQueryInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Question</label>
              <Textarea
                placeholder="e.g., What repositories have I been most active in?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isStreaming || (showQueryInput && !query)}
            className="w-full"
          >
            {isStreaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insight
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {(streamedContent || isStreaming) && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedInsight?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{streamedContent}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
