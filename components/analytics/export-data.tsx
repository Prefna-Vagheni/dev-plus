// components/analytics/export-data.tsx - Export Data Component
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from 'date-fns';

interface ExportDataProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

type ExportType = 'overview' | 'activities' | 'repositories' | 'dailyStats';
type ExportFormat = 'json' | 'csv';

export function ExportData({ dateRange }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams({ type, format });

      if (dateRange) {
        params.set('from', dateRange.from.toISOString());
        params.set('to', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/export?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `devpulse-export-${format}-${formatDate(new Date(), 'yyyy-MM-dd')}.${format}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Analytics</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Overview */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Overview Summary
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('overview', 'json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Overview (JSON)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('overview', 'csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Overview (CSV)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Activities */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Activity Events
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('activities', 'json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Activities (JSON)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('activities', 'csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Activities (CSV)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Repositories */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Repositories
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('repositories', 'json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Repositories (JSON)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('repositories', 'csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Repositories (CSV)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Daily Stats */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Daily Statistics
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('dailyStats', 'json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Daily Stats (JSON)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('dailyStats', 'csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Daily Stats (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
