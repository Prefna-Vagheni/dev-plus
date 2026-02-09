// lib/auth-client.ts - Client-side auth utilities
'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const { useSession, signIn, signOut, signUp } = authClient;
