// src/app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth-utils';
import { UserAvatar } from '@/components/auth/user-avatar';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <UserAvatar />
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {session.user.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your authenticated dashboard is working correctly.
          </p>
        </div>
      </main>
    </div>
  );
}
