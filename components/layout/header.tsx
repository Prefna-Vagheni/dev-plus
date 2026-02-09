// components/layout/header.tsx
'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/auth/user-avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileSidebar } from './mobile-sidebar';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Mobile sidebar toggle */}
        <MobileSidebar />

        {/* Page title */}
        <h1 className="text-xl font-semibold">{title}</h1>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="hidden w-96 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search activity..." className="pl-9" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600"></span>
          </Button>

          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
