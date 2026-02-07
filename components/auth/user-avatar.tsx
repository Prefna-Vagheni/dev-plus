// components/auth/user-avatar.tsx
'use client';

import { useSession } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';

export function UserAvatar() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    'U';

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
          router.refresh();
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || 'User'}
            />
            <AvatarFallback className="bg-blue-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <User className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
