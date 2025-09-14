import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value;

    if (token) {
      // Delete session from database
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    // Clear the cookie
    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.cookies.delete('session-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
