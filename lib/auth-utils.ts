// lib/auth-utils.ts - Server-side auth utilities
import { auth } from '@/lib/auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Get the current session (cached for request)
 * Use this in Server Components and Server Actions
 */
export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
});

/**
 * Get current user or redirect to login
 * Use this to protect Server Components
 */
export async function requireAuth() {
  // BYPASS IN TEST MODE
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.PLAYWRIGHT_TEST === 'true'
  ) {
    const cookieStore = await cookies();
    const testSession = cookieStore.get('better-auth.session_token');

    if (testSession?.value === 'test-session-token') {
      console.log('[TEST MODE] Bypassing requireAuth()');
      return {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      };
    }
  }

  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * Get current user or return null
 * Use this when auth is optional
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}
