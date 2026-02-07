// components/auth/logout-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  className,
  showIcon = true,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/login');
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
