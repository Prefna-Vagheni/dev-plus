'use client';

import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  // Preset options
  const presets = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: 'Last 90 days',
      getValue: () => ({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: 'This year',
      getValue: () => ({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(),
      }),
    },
  ];

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-75 justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'LLL dd, y')} -{' '}
                  {format(value.to, 'LLL dd, y')}
                </>
              ) : (
                format(value.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="border-r p-3 space-y-1">
              <div className="text-sm font-medium mb-2">Presets</div>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    onChange(preset.getValue());
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
