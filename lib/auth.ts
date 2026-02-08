// lib/auth.ts - Better Auth configuration
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
// import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';
import { createId } from '@paralleldrive/cuid2';

// const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: false, // We're using GitHub OAuth only for now
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      // Request additional scopes for GitHub API access
      scope: ['user:email', 'read:user', 'repo'],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },

  user: {
    // Additional fields to sync from GitHub
    additionalFields: {
      githubId: {
        type: 'string',
        required: false,
      },
      githubUsername: {
        type: 'string',
        required: false,
      },
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookieName: 'devpulse.session-token',
    generateId: () => {
      // Use cuid for consistency with Prisma
      return createId();
    },
  },

  // Callbacks for custom behavior
  callbacks: {
    async signIn({ user, account }) {
      // Custom logic after sign in
      if (account?.provider === 'github') {
        // Store GitHub-specific data
        await prisma.user.update({
          where: { id: user.id },
          data: {
            githubId: account.providerAccountId,
            githubUsername: account.profile?.login,
          },
        });

        // Create default user settings
        await prisma.userSettings.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            timezone: 'UTC',
            theme: 'system',
          },
          update: {},
        });
      }

      return true;
    },
  },
});

export type Session = typeof auth.$Infer.Session;
