// components/charts/productivity-trends-chart.tsx - Productivity Trends Chart
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ProductivityTrendsChartProps {
  data: Array<{
    date: string;
    totalCommits: number;
    totalPullRequests: number;
    totalIssues: number;
    codingTimeSeconds: number;
  }>;
}

export function ProductivityTrendsChart({
  data,
}: ProductivityTrendsChartProps) {
  const chartData = useMemo(() => {
    return data.map((day) => ({
      date: format(new Date(day.date), 'MMM dd'),
      commits: day.totalCommits,
      prs: day.totalPullRequests,
      issues: day.totalIssues,
      hours: Math.round((day.codingTimeSeconds / 3600) * 10) / 10, // Convert to hours
    }));
  }, [data]);

  const maxHours = useMemo(() => {
    return Math.max(...chartData.map((d) => d.hours), 1);
  }, [chartData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productivity Trends</CardTitle>
        <CardDescription>
          Your coding activity and hours over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No productivity data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                yAxisId="left"
                label={{
                  value: 'Activities',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                yAxisId="right"
                orientation="right"
                label={{ value: 'Hours', angle: 90, position: 'insideRight' }}
                domain={[0, maxHours]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0]?.payload.date}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Commits
                          </span>
                          <span className="font-bold">
                            {payload[0]?.payload.commits}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            PRs
                          </span>
                          <span className="font-bold">
                            {payload[0]?.payload.prs}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Hours
                          </span>
                          <span className="font-bold">
                            {payload[0]?.payload.hours}h
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="commits"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Commits"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="prs"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="PRs"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hours"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
