// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 /api/auth/me endpoint called');
    const authResult = await authenticateRequest(request);
    
    if (authResult.error) {
      console.log('❌ Auth failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    console.log('✅ Auth successful, returning user:', authResult.user?.email);
    return NextResponse.json({ user: authResult.user });
  } catch (error) {
    console.error('❌ Error in /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}