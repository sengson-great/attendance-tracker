import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Check if it's an admin route but NOT the login page
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const adminSession = request.cookies.get('admin_session');
    
    if (!adminSession?.value) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const payload = await verifySession(adminSession.value);
    if (!payload?.admin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Only run middleware on /admin and /api routes to avoid unnecessary overhead
export const config = {
  matcher: ['/admin/:path*'],
};
