// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const token = request.cookies.get('session-token')?.value;
  
  if (token) {
    // Delete session from database
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // Clear cookie
  const response = NextResponse.json({ message: 'Logout successful' });
  response.cookies.delete('session-token');

  return response;
}