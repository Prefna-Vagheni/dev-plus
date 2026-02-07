// lib/auth-utils.ts - Server-side auth utilities
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
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
