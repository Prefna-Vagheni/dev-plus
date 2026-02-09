// app/api/auth-debug/route.ts - Diagnostic endpoint
import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    nodeEnv: process.env.NODE_ENV,
    hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
    hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    githubClientIdLength: process.env.GITHUB_CLIENT_ID?.length || 0,
    githubClientSecretLength: process.env.GITHUB_CLIENT_SECRET?.length || 0,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  };

  return NextResponse.json(diagnostics);
}
