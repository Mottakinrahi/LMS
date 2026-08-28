import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/courses/create');

  // 1. If trying to access protected routes without a token, redirect to /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If logged in and accessing /login or /signup, redirect to /dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. If token exists and accessing restricted role routes, verify user role with Strapi
  if (token && isProtectedRoute) {
    try {
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
      const userRes = await fetch(`${strapiUrl}/api/users/me?populate=role`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) {
        // Invalid token - clear cookie and redirect to login
        const res = NextResponse.redirect(new URL('/login', request.url));
        res.cookies.set('token', '', { expires: new Date(0), path: '/' });
        return res;
      }

      const user = await userRes.json();
      const roleName = user.role?.name || user.role?.type || '';

      // Admin-only route guard
      if (pathname.startsWith('/admin') && roleName !== 'Admin' && roleName !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }

      // Instructor-only route guard
      if (
        (pathname.startsWith('/instructor') || pathname.startsWith('/courses/create')) &&
        roleName !== 'Instructor' &&
        roleName !== 'instructor' &&
        roleName !== 'Admin' &&
        roleName !== 'admin' &&
        roleName !== 'Content Manager'
      ) {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }
    } catch (err) {
      console.error('Middleware auth check error:', err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/instructor/:path*',
    '/courses/create',
    '/login',
    '/signup',
  ],
};
