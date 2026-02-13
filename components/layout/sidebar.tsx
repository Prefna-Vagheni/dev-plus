// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  GitBranch,
  Home,
  Settings,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Activity',
    href: '/dashboard/activity',
    icon: Calendar,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
  },
  {
    name: 'Repositories',
    href: '/dashboard/repositories',
    icon: GitBranch,
  },
  {
    name: 'AI Insights',
    icon: Sparkles,
    href: '/dashboard/insights',
    color: 'text-purple-500',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold">DevPulse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 text-xs">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Try AI Insights
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Get personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
