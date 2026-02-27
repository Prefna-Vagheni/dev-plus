import { JobMonitor } from '@/components/jobs/job-monitor';

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Background Jobs</h2>
        <p className="text-gray-500">Monitor sync and processing jobs</p>
      </div>

      <JobMonitor />
    </div>
  );
}
