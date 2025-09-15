// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthToken, authenticateUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        const user = await authenticateUser(email, password);
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = await generateAuthToken(user);

        // Redirect to the dashboard after a successful login
        const response = NextResponse.redirect(new URL('/dashboard', request.url), 302);
        
        // Set the token as a cookie
        response.cookies.set('session-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}