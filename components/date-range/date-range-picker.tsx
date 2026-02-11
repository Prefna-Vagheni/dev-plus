'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { DateRangePicker } from '../analytics/date-range-picker';
import { Skeleton } from '../ui/skeleton';

export default function Range() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  //eslint-disable-next-line
  const [overview, setOverview] = useState<any>(null);
  //eslint-disable-next-line
  const [trends, setTrends] = useState<any[]>([]);
  //eslint-disable-next-line
  const [languages, setLanguages] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.set('from', dateRange.from.toISOString());
      if (dateRange?.to) params.set('to', dateRange.to.toISOString());

      const [overviewRes, trendsRes, languagesRes] = await Promise.all([
        fetch(`/api/analytics/overview?${params}`),
        fetch(`/api/analytics/trends?${params}`),
        fetch(`/api/analytics/languages?${params}`),
      ]);

      const overviewData = await overviewRes.json();
      const trendsData = await trendsRes.json();
      const languagesData = await languagesRes.json();

      setOverview(overviewData);
      setTrends(trendsData.trends);
      setLanguages(languagesData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !overview) {
    return <Skeleton />;
  }

  return <DateRangePicker value={dateRange} onChange={setDateRange} />;
}
