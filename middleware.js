import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const authTokenCookie = request.cookies.get('auth_token');

  // If there's no auth token and the user is trying to access a protected admin page
  if (!authTokenCookie && pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
    // Redirect to the login page
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // A basic check for API routes as well. The actual validation happens in the route itself.
  if (!authTokenCookie && pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/login')) {
    return new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized: No auth token found.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
