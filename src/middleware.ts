// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
    // Define protected routes
    const protectedRoutes = ['/dashboard', '/api/data-sources', '/api/dashboard'];
    const isProtectedRoute = protectedRoutes.some(route => 
        request.nextUrl.pathname.startsWith(route)
    );
    
    if (isProtectedRoute) {
        // Check for auth token in cookies
        const token = request.cookies.get('auth-token')?.value;
        
        if (!token) {
            // Redirect to login for page routes
            if (!request.nextUrl.pathname.startsWith('/api')) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
            // Return 401 for API routes
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        
        // Verify token
        const user = await verifyAuthToken(token);
        if (!user) {
            if (!request.nextUrl.pathname.startsWith('/api')) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/:path*']
};
