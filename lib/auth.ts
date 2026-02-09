// lib/auth.ts - Better Auth configuration with improved error handling
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: false,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Request additional scopes for GitHub API access
      scope: ['user:email', 'read:user', 'repo'],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookieName: 'devpulse.session-token',
  },
});

export type Session = typeof auth.$Infer.Session;
