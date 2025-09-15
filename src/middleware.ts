import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     * - /login (login page)
     * - /api/auth/login (login API endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth/login).*)'
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session on all matched routes
  const authResult = await authenticateRequest(request);

  // If no session and not an auth API route, redirect to login
  if (authResult.error && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', request.url);
    
    // If it's an API call, return 401 Unauthorized
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    
    // For page navigations, redirect to the login page
    return NextResponse.redirect(loginUrl);
  }
  
  // If there is a session, continue
  return NextResponse.next();
}
