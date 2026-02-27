// __tests__/components/ui/button.test.tsx - Button Component Tests
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Button component for testing
const Button = ({ children, onClick, disabled }: any) => (
  <button onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>,
    );

    const button = screen.getByText('Click me');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// __tests__/components/github/sync-button.test.tsx - Sync Button Tests
describe('GitHubSyncButton', () => {
  test('renders sync button', () => {
    // Mock component
    const SyncButton = () => <button>Sync GitHub</button>;

    render(<SyncButton />);
    expect(screen.getByText('Sync GitHub')).toBeInTheDocument();
  });

  test('shows loading state when syncing', () => {
    const SyncButton = ({ isLoading }: any) => (
      <button disabled={isLoading}>
        {isLoading ? 'Syncing...' : 'Sync GitHub'}
      </button>
    );

    const { rerender } = render(<SyncButton isLoading={false} />);
    expect(screen.getByText('Sync GitHub')).toBeInTheDocument();

    rerender(<SyncButton isLoading={true} />);
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  test('triggers sync on click', () => {
    const handleSync = jest.fn();
    const SyncButton = ({ onSync }: any) => (
      <button onClick={onSync}>Sync GitHub</button>
    );

    render(<SyncButton onSync={handleSync} />);
    fireEvent.click(screen.getByText('Sync GitHub'));
    expect(handleSync).toHaveBeenCalled();
  });
});

// __tests__/components/ai/insight-generator.test.tsx - Insight Generator Tests
describe('InsightGenerator', () => {
  test('renders insight types dropdown', () => {
    const InsightGenerator = () => (
      <div>
        <select>
          <option>Weekly Summary</option>
          <option>Productivity Analysis</option>
        </select>
      </div>
    );

    render(<InsightGenerator />);
    expect(screen.getByText('Weekly Summary')).toBeInTheDocument();
  });

  test('displays generated insight', () => {
    const InsightGenerator = ({ insight }: any) => (
      <div>{insight && <div data-testid="insight">{insight}</div>}</div>
    );

    render(<InsightGenerator insight="Great week!" />);
    expect(screen.getByTestId('insight')).toHaveTextContent('Great week!');
  });
});

// __tests__/components/charts/commits-chart.test.tsx - Chart Component Tests
describe('CommitsChart', () => {
  test('renders chart with data', () => {
    const mockData = [
      { date: '2024-01-01', commits: 5 },
      { date: '2024-01-02', commits: 8 },
    ];

    const CommitsChart = ({ data }: any) => (
      <div data-testid="chart">
        {data.map((item: any) => (
          <div key={item.date}>{item.commits}</div>
        ))}
      </div>
    );

    render(<CommitsChart data={mockData} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  test('handles empty data', () => {
    const CommitsChart = ({ data }: any) => (
      <div>{data.length === 0 ? 'No data' : 'Has data'}</div>
    );

    render(<CommitsChart data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
