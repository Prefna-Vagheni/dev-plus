// hooks/use-analytics.ts
import { useQuery } from '@tanstack/react-query';

export function useAnalytics(dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['analytics', 'overview', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) {
        params.set('from', dateRange.from.toISOString());
        params.set('to', dateRange.to.toISOString());
      }
      const response = await fetch(`/api/analytics/overview?${params}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
