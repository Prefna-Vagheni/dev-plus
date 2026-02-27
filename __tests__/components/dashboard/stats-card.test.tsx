import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/stats-card';

describe('StatsCard', () => {
  test('renders stat value', () => {
    render(<StatsCard title="Total Commits" value={150} icon={<>📊</>} />);

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  test('formats large numbers', () => {
    render(<StatsCard title="Commits" value={1234567} />);

    // Should format as 1.2M or similar
    expect(screen.getByText(/1\.2M|1,234,567/)).toBeInTheDocument();
  });
});
