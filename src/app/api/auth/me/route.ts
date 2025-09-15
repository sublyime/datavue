
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // The session object contains the user payload, which we return as 'user'
  return NextResponse.json({ user: session });
}
