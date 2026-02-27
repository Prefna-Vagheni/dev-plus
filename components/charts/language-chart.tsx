'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface LanguageChartProps {
  data: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function LanguageChart({ data }: LanguageChartProps) {
  const topLanguages = data.slice(0, 8); // Show top 8

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={topLanguages}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ payload }) =>
            `${payload.name} (${payload.percentage.toFixed(1)}%)`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {topLanguages.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
