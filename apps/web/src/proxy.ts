import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'access-secret-dev-key-change-in-prod');

// Public paths — no auth required
const PUBLIC_PATHS = ['/', '/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and auth API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;

  // If on a public path and already logged in, redirect to dashboard
  if (PUBLIC_PATHS.includes(pathname) && token) {
    try {
      await jwtVerify(token, accessSecret);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Token invalid — let them stay on public path
    }
  }

  // Public paths don't need auth
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected paths — require valid access token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, accessSecret);
    const role = payload.role as string;

    // STAFF cannot access restricted routes
    const restrictedForStaff = ['/salary', '/reports', '/expenses', '/employees', '/api/salary', '/api/reports', '/api/expenses', '/api/employees'];
    if (role === 'STAFF' && restrictedForStaff.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-user-role', role);
    response.headers.set('x-user-id', payload.id as string);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
