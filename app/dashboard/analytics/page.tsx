'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { DateRangePicker } from '@/components/analytics/date-range-picker';
import { ProductivityTrendsChart } from '@/components/charts/productivity-trend-chart';
import { BestCodingTime } from '@/components/analytics/best-coding-time';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    // const response = await fetch('/api/analytics/timeline?limit=1000');
    // const data = await response.json();
    // setActivities(data);

    try {
      const response = await fetch('/api/analytics/timeline?limit=1000');
      const result = await response.json();
      // Ensure we only set the state if the result is actually an array
      setActivities(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]); // Fallback to empty array on network error
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.set('from', dateRange.from.toISOString());
      if (dateRange?.to) params.set('to', dateRange.to.toISOString());

      const response = await fetch(`/api/analytics/daily-stats?${params}`);
      const result = await response.json();
      setData(result.stats || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-gray-500">
            Deep dive into your productivity patterns
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <ProductivityTrendsChart data={data} />
          <BestCodingTime activities={activities} />
        </div>
      )}
    </div>
  );
}
