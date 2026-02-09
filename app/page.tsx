// app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  Brain,
  GitBranch,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { getSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Redirect to dashboard if already logged in
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur dark:bg-gray-900/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">DevPulse</span>
          </div>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Sparkles className="h-4 w-4" />
            AI-Powered Analytics Platform
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Track Your Developer
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}
              Journey
            </span>
          </h1>

          <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
            Analyze your coding patterns, track productivity, and get AI-powered
            insights to become a better developer.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Demo
            </Button>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            No credit card required • Free forever for personal use
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Everything you need to level up
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Powerful features to help you understand and improve your
            development workflow
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Real-time Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track commits, PRs, and coding time with beautiful, real-time
                dashboards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Insights</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get personalized recommendations and pattern analysis powered by
                Claude AI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <GitBranch className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">GitHub Integration</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Seamlessly sync your GitHub activity and repository data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Productivity Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor coding time, identify patterns, and optimize your
                workflow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                <BarChart3 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Beautiful Charts</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize your data with interactive charts and timelines
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 inline-flex rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/30">
                <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Natural Language</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ask questions about your activity in plain English
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
          <CardContent className="p-12 text-center text-white">
            <h2 className="mb-4 text-3xl font-bold">Ready to level up?</h2>
            <p className="mb-8 text-lg text-blue-50">
              Join developers who are already tracking their progress
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Start Free Today
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">DevPulse</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 DevPulse. Built with ❤️ for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
