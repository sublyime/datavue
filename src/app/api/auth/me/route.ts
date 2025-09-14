// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  return NextResponse.json({ user: authResult.user });
}