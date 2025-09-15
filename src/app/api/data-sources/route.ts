// src/app/api/data-sources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    try {
        // Extract token from Authorization header or cookies
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('auth-token')?.value;
        
        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' }, 
                { status: 401 }
            );
        }
        
        // Verify the token
        const user = await verifyAuthToken(token);
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid token' }, 
                { status: 401 }
            );
        }
        
        // Proceed with authenticated request
        const dataSources = await getDataSources(user.id);
        return NextResponse.json(dataSources);
        
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}
