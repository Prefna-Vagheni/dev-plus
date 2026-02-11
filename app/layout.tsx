// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { getSession } from '@/lib/auth-utils';
import { WebSocketProvider } from '@/components/providers/websocket-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevPulse - Developer Analytics Platform',
  description:
    'Track your coding activity, analyze patterns, and get AI-powered insights',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {session?.user ? (
            <WebSocketProvider userId={session.user.id}>
              {children}
            </WebSocketProvider>
          ) : (
            children
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
