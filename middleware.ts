// middleware.ts - Route protection
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/api/auth'];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, verify session
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      // Redirect to login if no session
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Session exists, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
