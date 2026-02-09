// app/login/page.tsx - Login page with error handling
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, BarChart3, Zap, Brain, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (session && !isPending) {
      router.push(callbackUrl);
    }
  }, [session, isPending, router, callbackUrl]);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await signIn.social({
        provider: 'github',
        callbackURL: callbackUrl,
      });
    } catch (err) {
      console.error('Sign in error:', err);
      setError(
        'Failed to sign in. Please check your configuration and try again.',
      );
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold">DevPulse</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Developer Analytics Platform
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track your coding activity, analyze patterns, and get AI-powered
            insights to optimize your development workflow.
          </p>

          <div className="grid gap-4 pt-4">
            <div className="flex items-start space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Real-time Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Live dashboard with insights from your GitHub activity
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Brain className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI-Powered Insights
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get personalized recommendations and pattern analysis
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Zap className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Productivity Tracking
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor coding time, commits, PRs, and more
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in with your GitHub account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGitHubSignIn}
              className="w-full"
              size="lg"
              variant="default"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </>
              )}
            </Button>

            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              By signing in, you agree to sync your GitHub activity data. We
              only access public repository information and your profile.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
